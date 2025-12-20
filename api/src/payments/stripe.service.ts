import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface StripeCustomerData {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
}

export interface StripeSubscriptionData {
    customerId: string;
    priceId: string;
    paymentMethodId?: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
}

export interface StripePaymentIntentData {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
}

@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);
    private readonly stripe: Stripe | null;
    private readonly isEnabled: boolean;

    constructor(private readonly configService: ConfigService) {
        const secretKey = this.configService.get<string>('stripe.secretKey');

        // Check if Stripe is properly configured (not placeholder)
        if (!secretKey || secretKey.includes('placeholder')) {
            this.logger.warn('Stripe is not configured or using placeholder key - payment features disabled');
            this.stripe = null;
            this.isEnabled = false;
        } else {
            this.stripe = new Stripe(secretKey, {
                typescript: true,
            });
            this.isEnabled = true;
            this.logger.log('Stripe service initialized successfully');
        }
    }

    private ensureStripeEnabled(): void {
        if (!this.isEnabled || !this.stripe) {
            throw new Error('Stripe service is not enabled - check your configuration');
        }
    }

    /**
     * Create Stripe customer
     */
    async createCustomer(customerData: StripeCustomerData): Promise<Stripe.Customer> {
        this.ensureStripeEnabled();
        try {
            this.logger.log(`Creating Stripe customer for email: ${customerData.email}`);

            const customer = await this.stripe!.customers.create({
                email: customerData.email,
                name: customerData.name,
                metadata: customerData.metadata || {},
            });

            this.logger.log(`Stripe customer created: ${customer.id}`);
            return customer;
        } catch (error) {
            this.logger.error('Failed to create Stripe customer', error);
            throw new Error(`Failed to create customer: ${error.message}`);
        }
    }

    /**
     * Get or create Stripe customer
     */
    async getOrCreateCustomer(customerData: StripeCustomerData): Promise<Stripe.Customer> {
        this.ensureStripeEnabled();
        try {
            // First, try to find existing customer by email
            const existingCustomers = await this.stripe!.customers.list({
                email: customerData.email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                const customer = existingCustomers.data[0];
                this.logger.log(`Found existing Stripe customer: ${customer.id}`);
                return customer;
            }

            // Create new customer if not found
            return await this.createCustomer(customerData);
        } catch (error) {
            this.logger.error('Failed to get or create Stripe customer', error);
            throw error;
        }
    }

    /**
     * Create subscription
     */
    async createSubscription(subscriptionData: StripeSubscriptionData): Promise<Stripe.Subscription> {
        try {
            this.logger.log(`Creating Stripe subscription for customer: ${subscriptionData.customerId}`);

            const subscriptionParams: Stripe.SubscriptionCreateParams = {
                customer: subscriptionData.customerId,
                items: [{ price: subscriptionData.priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: subscriptionData.metadata || {},
            };

            if (subscriptionData.trialPeriodDays) {
                subscriptionParams.trial_period_days = subscriptionData.trialPeriodDays;
            }

            if (subscriptionData.paymentMethodId) {
                subscriptionParams.default_payment_method = subscriptionData.paymentMethodId;
            }

            const subscription = await this.stripe.subscriptions.create(subscriptionParams);

            this.logger.log(`Stripe subscription created: ${subscription.id}`);
            return subscription;
        } catch (error) {
            this.logger.error('Failed to create Stripe subscription', error);
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }

    /**
     * Update subscription
     */
    async updateSubscription(
        subscriptionId: string,
        updates: Partial<Stripe.SubscriptionUpdateParams>
    ): Promise<Stripe.Subscription> {
        try {
            this.logger.log(`Updating Stripe subscription: ${subscriptionId}`);

            const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);

            this.logger.log(`Stripe subscription updated: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            this.logger.error('Failed to update Stripe subscription', error);
            throw new Error(`Failed to update subscription: ${error.message}`);
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(
        subscriptionId: string,
        immediately = false
    ): Promise<Stripe.Subscription> {
        try {
            this.logger.log(`Canceling Stripe subscription: ${subscriptionId}, immediately: ${immediately}`);

            const subscription = immediately
                ? await this.stripe.subscriptions.cancel(subscriptionId)
                : await this.stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });

            this.logger.log(`Stripe subscription canceled: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            this.logger.error('Failed to cancel Stripe subscription', error);
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    /**
     * Create payment intent
     */
    async createPaymentIntent(paymentData: StripePaymentIntentData): Promise<Stripe.PaymentIntent> {
        try {
            this.logger.log(`Creating Stripe payment intent for amount: ${paymentData.amount} ${paymentData.currency}`);

            const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(paymentData.amount * 100), // Convert to cents
                currency: paymentData.currency.toLowerCase(),
                customer: paymentData.customerId,
                metadata: paymentData.metadata || {},
                automatic_payment_methods: { enabled: true },
            };

            if (paymentData.paymentMethodId) {
                paymentIntentParams.payment_method = paymentData.paymentMethodId;
                paymentIntentParams.confirm = true;
            }

            const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

            this.logger.log(`Stripe payment intent created: ${paymentIntent.id}`);
            return paymentIntent;
        } catch (error) {
            this.logger.error('Failed to create Stripe payment intent', error);
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }

    /**
     * Retrieve subscription
     */
    async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            return subscription;
        } catch (error) {
            this.logger.error('Failed to retrieve Stripe subscription', error);
            throw new Error(`Failed to retrieve subscription: ${error.message}`);
        }
    }

    /**
     * List customer subscriptions
     */
    async listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
        try {
            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                expand: ['data.default_payment_method'],
            });

            return subscriptions.data;
        } catch (error) {
            this.logger.error('Failed to list customer subscriptions', error);
            throw new Error(`Failed to list subscriptions: ${error.message}`);
        }
    }

    /**
     * Create setup intent for saving payment method
     */
    async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
        try {
            this.logger.log(`Creating setup intent for customer: ${customerId}`);

            const setupIntent = await this.stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
                usage: 'off_session',
            });

            return setupIntent;
        } catch (error) {
            this.logger.error('Failed to create setup intent', error);
            throw new Error(`Failed to create setup intent: ${error.message}`);
        }
    }

    /**
     * Attach payment method to customer
     */
    async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
        try {
            const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            return paymentMethod;
        } catch (error) {
            this.logger.error('Failed to attach payment method', error);
            throw new Error(`Failed to attach payment method: ${error.message}`);
        }
    }

    /**
     * List customer payment methods
     */
    async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });

            return paymentMethods.data;
        } catch (error) {
            this.logger.error('Failed to list payment methods', error);
            throw new Error(`Failed to list payment methods: ${error.message}`);
        }
    }

    /**
     * Construct webhook event
     */
    constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
        const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

        if (!webhookSecret) {
            throw new Error('Stripe webhook secret is required');
        }

        try {
            return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (error) {
            this.logger.error('Failed to construct webhook event', error);
            throw new Error(`Webhook signature verification failed: ${error.message}`);
        }
    }

    /**
     * Get stripe instance for advanced operations
     */
    getStripeInstance(): Stripe {
        return this.stripe;
    }
}