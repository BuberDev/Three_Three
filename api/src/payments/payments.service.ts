import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly stripeService: StripeService,
        private readonly usersService: UsersService,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    /**
     * Create setup intent for user
     */
    async createSetupIntent(userId: string) {
        try {
            const user = await this.usersService.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get or create Stripe customer
            let stripeCustomerId = user.metadata?.stripeCustomerId;

            if (!stripeCustomerId) {
                const customer = await this.stripeService.getOrCreateCustomer({
                    email: user.email,
                    name: user.fullName,
                    metadata: { userId: user.id }
                });

                stripeCustomerId = customer.id;

                // Update user with Stripe customer ID
                await this.usersService.update(userId, {
                    metadata: {
                        ...user.metadata,
                        stripeCustomerId
                    }
                });
            }

            const setupIntent = await this.stripeService.createSetupIntent(stripeCustomerId);

            return {
                clientSecret: setupIntent.client_secret,
                customerId: stripeCustomerId
            };
        } catch (error) {
            this.logger.error('Failed to create setup intent', error);
            throw new Error(`Failed to create setup intent: ${error.message}`);
        }
    }

    /**
     * Get payment methods for user
     */
    async getPaymentMethods(userId: string) {
        try {
            const user = await this.usersService.findById(userId);
            if (!user?.metadata?.stripeCustomerId) {
                return { paymentMethods: [] };
            }

            const paymentMethods = await this.stripeService.listPaymentMethods(
                user.metadata.stripeCustomerId
            );

            return {
                paymentMethods: paymentMethods.map(pm => ({
                    id: pm.id,
                    type: pm.type,
                    card: pm.card ? {
                        brand: pm.card.brand,
                        last4: pm.card.last4,
                        expMonth: pm.card.exp_month,
                        expYear: pm.card.exp_year
                    } : null
                }))
            };
        } catch (error) {
            this.logger.error('Failed to get payment methods', error);
            throw new Error(`Failed to get payment methods: ${error.message}`);
        }
    }

    /**
     * Attach payment method to user
     */
    async attachPaymentMethod(userId: string, paymentMethodId: string) {
        try {
            const user = await this.usersService.findById(userId);
            if (!user?.metadata?.stripeCustomerId) {
                throw new Error('User does not have Stripe customer');
            }

            const paymentMethod = await this.stripeService.attachPaymentMethod(
                paymentMethodId,
                user.metadata.stripeCustomerId
            );

            this.logger.log(`Payment method ${paymentMethodId} attached to user ${userId}`);

            return {
                paymentMethod: {
                    id: paymentMethod.id,
                    type: paymentMethod.type,
                    card: paymentMethod.card ? {
                        brand: paymentMethod.card.brand,
                        last4: paymentMethod.card.last4,
                        expMonth: paymentMethod.card.exp_month,
                        expYear: paymentMethod.card.exp_year
                    } : null
                }
            };
        } catch (error) {
            this.logger.error('Failed to attach payment method', error);
            throw new Error(`Failed to attach payment method: ${error.message}`);
        }
    }

    /**
     * Handle Stripe webhooks
     */
    async handleStripeWebhook(payload: Buffer, signature: string) {
        try {
            const event = this.stripeService.constructWebhookEvent(payload, signature);
            this.logger.log(`Processing Stripe webhook: ${event.type}`);

            switch (event.type) {
                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                    break;

                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                    break;

                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                    break;

                case 'customer.subscription.trial_will_end':
                    await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
                    break;

                default:
                    this.logger.log(`Unhandled webhook event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            this.logger.error('Failed to process webhook', error);
            throw new Error(`Webhook processing failed: ${error.message}`);
        }
    }

    private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
        try {
            this.logger.log(`Handling subscription created: ${subscription.id}`);

            const customerId = subscription.customer as string;
            const userId = await this.getUserIdFromStripeCustomer(customerId);

            if (!userId) {
                this.logger.error(`User not found for Stripe customer: ${customerId}`);
                return;
            }

            // Update subscription in database
            const existingSubscription = await this.subscriptionsService.getSubscriptionSummary(userId);
            if (existingSubscription?.subscription) {
                await this.subscriptionsService.updateSubscription(userId, {
                    // Update with Stripe data
                });
            }

        } catch (error) {
            this.logger.error('Failed to handle subscription created', error);
        }
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        try {
            this.logger.log(`Handling subscription updated: ${subscription.id}`);

            const customerId = subscription.customer as string;
            const userId = await this.getUserIdFromStripeCustomer(customerId);

            if (!userId) {
                this.logger.error(`User not found for Stripe customer: ${customerId}`);
                return;
            }

            // Sync subscription status with database
            // Handle status changes, plan changes, etc.

        } catch (error) {
            this.logger.error('Failed to handle subscription updated', error);
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        try {
            this.logger.log(`Handling subscription deleted: ${subscription.id}`);

            const customerId = subscription.customer as string;
            const userId = await this.getUserIdFromStripeCustomer(customerId);

            if (!userId) {
                this.logger.error(`User not found for Stripe customer: ${customerId}`);
                return;
            }

            // Cancel subscription in database
            await this.subscriptionsService.cancelSubscription(userId, {
                reason: 'Canceled via Stripe'
            });

        } catch (error) {
            this.logger.error('Failed to handle subscription deleted', error);
        }
    }

    private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
        try {
            this.logger.log(`Handling payment succeeded: ${invoice.id}`);

            if ((invoice as any).subscription) {
                const subscription = await this.stripeService.retrieveSubscription(
                    (invoice as any).subscription as string
                );

                const customerId = subscription.customer as string;
                const userId = await this.getUserIdFromStripeCustomer(customerId);

                if (userId) {
                    // Record successful payment transaction
                    // Update subscription status if needed
                }
            }

        } catch (error) {
            this.logger.error('Failed to handle payment succeeded', error);
        }
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        try {
            this.logger.log(`Handling payment failed: ${invoice.id}`);

            if ((invoice as any).subscription) {
                const subscription = await this.stripeService.retrieveSubscription(
                    (invoice as any).subscription as string
                );

                const customerId = subscription.customer as string;
                const userId = await this.getUserIdFromStripeCustomer(customerId);

                if (userId) {
                    // Record failed payment transaction
                    // Handle payment failure logic (retry, suspend, etc.)
                }
            }

        } catch (error) {
            this.logger.error('Failed to handle payment failed', error);
        }
    }

    private async handleTrialWillEnd(subscription: Stripe.Subscription) {
        try {
            this.logger.log(`Handling trial will end: ${subscription.id}`);

            const customerId = subscription.customer as string;
            const userId = await this.getUserIdFromStripeCustomer(customerId);

            if (userId) {
                // Send trial ending notification
                // Trigger upgrade prompts in app
            }

        } catch (error) {
            this.logger.error('Failed to handle trial will end', error);
        }
    }

    private async getUserIdFromStripeCustomer(customerId: string): Promise<string | null> {
        try {
            // Find user by Stripe customer ID in metadata
            const user = await this.usersService.findByStripeCustomerId(customerId);
            return user?.id || null;
        } catch (error) {
            this.logger.error('Failed to get user from Stripe customer', error);
            return null;
        }
    }
}