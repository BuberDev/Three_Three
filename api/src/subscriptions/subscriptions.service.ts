import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeService } from '../payments/stripe.service';
import { UsersService } from '../users/users.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto, UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionPlanConfig } from './entities/subscription-plan-config.entity';
import { SubscriptionTransaction, TransactionStatus, TransactionType } from './entities/subscription-transaction.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionFeature, SubscriptionPlan, SubscriptionStatus } from './enums/subscription.enums';

export interface SubscriptionSummary {
    subscription: Subscription;
    planConfig: SubscriptionPlanConfig;
    usage: {
        voiceNotesUsed: number;
        sleepSessionsUsed: number;
        exportsThisMonth: number;
    };
    daysRemaining: number;
    nextBillingDate?: Date;
}

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,
        @InjectRepository(SubscriptionPlanConfig)
        private readonly planConfigRepository: Repository<SubscriptionPlanConfig>,
        @InjectRepository(SubscriptionTransaction)
        private readonly transactionRepository: Repository<SubscriptionTransaction>,
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => StripeService))
        private readonly stripeService: StripeService,
    ) { }

    /**
     * Start 7-day trial for new user
     */
    async startTrial(userId: string): Promise<Subscription> {
        // Check if user already has a subscription
        const existingSubscription = await this.findActiveSubscriptionByUserId(userId);
        if (existingSubscription) {
            throw new ConflictException('User already has an active subscription');
        }

        // Check if user has already used trial
        const previousTrial = await this.subscriptionRepository.findOne({
            where: {
                userId,
                status: SubscriptionStatus.TRIAL
            }
        });

        if (previousTrial) {
            throw new ConflictException('User has already used their free trial');
        }

        const subscription = this.subscriptionRepository.create({
            userId,
            plan: SubscriptionPlan.FREE_TRIAL,
            status: SubscriptionStatus.TRIAL,
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            autoRenew: false,
            metadata: {
                source: 'registration'
            }
        });

        return this.subscriptionRepository.save(subscription);
    }

    /**
     * Create paid subscription with Stripe integration
     */
    async createSubscription(
        userId: string,
        createSubscriptionDto: CreateSubscriptionDto
    ): Promise<Subscription> {
        const { plan, paymentMethodId, couponCode } = createSubscriptionDto;

        // Get user details
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get plan configuration
        const planConfig = await this.getPlanConfig(plan);
        if (!planConfig) {
            throw new NotFoundException(`Plan ${plan} not found`);
        }

        // Check for existing subscription
        const existingSubscription = await this.findActiveSubscriptionByUserId(userId);

        // Get or create Stripe customer
        let stripeCustomerId = user.metadata?.stripeCustomerId;
        if (!stripeCustomerId) {
            const stripeCustomer = await this.stripeService.getOrCreateCustomer({
                email: user.email,
                name: user.fullName,
                metadata: { userId: user.id }
            });
            stripeCustomerId = stripeCustomer.id;

            // Update user with Stripe customer ID
            await this.usersService.update(userId, {
                metadata: {
                    ...user.metadata,
                    stripeCustomerId
                }
            });
        }

        let subscription: Subscription;
        let stripeSubscription;

        if (existingSubscription?.status === SubscriptionStatus.TRIAL) {
            // Upgrade from trial
            subscription = existingSubscription;

            // Create Stripe subscription
            stripeSubscription = await this.stripeService.createSubscription({
                customerId: stripeCustomerId,
                priceId: planConfig.stripePriceId!,
                paymentMethodId,
                metadata: {
                    userId: user.id,
                    subscriptionId: subscription.id,
                    upgradeFromTrial: 'true'
                }
            });

            // Update subscription with Stripe data
            subscription.plan = plan;
            subscription.activatePaidSubscription(plan, planConfig.price, planConfig.currency);
            subscription.stripeSubscriptionId = stripeSubscription.id;
            subscription.stripeCustomerId = stripeCustomerId;
            subscription.stripePriceId = planConfig.stripePriceId;

            if (couponCode) {
                subscription.metadata.couponCode = couponCode;
            }
        } else if (existingSubscription) {
            throw new ConflictException('User already has an active subscription');
        } else {
            // New subscription - create in database first
            subscription = this.subscriptionRepository.create({
                userId,
                plan,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                amount: planConfig.price,
                currency: planConfig.currency,
                autoRenew: true,
                stripeCustomerId,
                stripePriceId: planConfig.stripePriceId,
                metadata: {
                    source: 'direct_purchase',
                    couponCode
                }
            });

            // Set period end based on plan
            const periodEnd = new Date();
            if (plan === SubscriptionPlan.MONTHLY_PRO) {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else if (plan === SubscriptionPlan.ANNUAL_PRO) {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }
            subscription.currentPeriodEnd = periodEnd;

            // Save subscription to get ID
            subscription = await this.subscriptionRepository.save(subscription);

            // Create Stripe subscription
            stripeSubscription = await this.stripeService.createSubscription({
                customerId: stripeCustomerId,
                priceId: planConfig.stripePriceId!,
                paymentMethodId,
                metadata: {
                    userId: user.id,
                    subscriptionId: subscription.id
                }
            });

            // Update subscription with Stripe ID
            subscription.stripeSubscriptionId = stripeSubscription.id;
        }

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        // Create transaction record
        await this.createTransaction(savedSubscription, {
            type: TransactionType.PAYMENT,
            amount: planConfig.price,
            currency: planConfig.currency,
            status: TransactionStatus.COMPLETED,
            stripePaymentIntentId: (stripeSubscription.latest_invoice as any)?.payment_intent?.id,
            metadata: { paymentMethod: paymentMethodId }
        });

        return savedSubscription;
    }

    /**
     * Update subscription
     */
    async updateSubscription(
        userId: string,
        updateSubscriptionDto: UpdateSubscriptionDto
    ): Promise<Subscription> {
        const subscription = await this.findActiveSubscriptionByUserId(userId);
        if (!subscription) {
            throw new NotFoundException('No active subscription found');
        }

        const { plan, autoRenew } = updateSubscriptionDto;

        if (plan && plan !== subscription.plan) {
            // Plan change
            const planConfig = await this.getPlanConfig(plan);
            if (!planConfig) {
                throw new NotFoundException(`Plan ${plan} not found`);
            }

            subscription.plan = plan;
            subscription.amount = planConfig.price;
            subscription.currency = planConfig.currency;

            // Prorate and update period end
            const now = new Date();
            if (plan === SubscriptionPlan.MONTHLY_PRO) {
                subscription.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            } else if (plan === SubscriptionPlan.ANNUAL_PRO) {
                subscription.currentPeriodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            }
        }

        if (autoRenew !== undefined) {
            subscription.autoRenew = autoRenew;
        }

        return this.subscriptionRepository.save(subscription);
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(
        userId: string,
        cancelSubscriptionDto: CancelSubscriptionDto
    ): Promise<Subscription> {
        const subscription = await this.findActiveSubscriptionByUserId(userId);
        if (!subscription) {
            throw new NotFoundException('No active subscription found');
        }

        const { reason, immediately = false } = cancelSubscriptionDto;

        if (immediately) {
            subscription.cancel(reason);
        } else {
            // Cancel at period end
            subscription.autoRenew = false;
            subscription.metadata.cancelationFeedback = reason;
        }

        return this.subscriptionRepository.save(subscription);
    }

    /**
     * Get subscription summary for user
     */
    async getSubscriptionSummary(userId: string): Promise<SubscriptionSummary | null> {
        const subscription = await this.findActiveSubscriptionByUserId(userId);
        if (!subscription) {
            return null;
        }

        const planConfig = await this.getPlanConfig(subscription.plan);

        // Calculate usage (simplified - should be actual usage from other services)
        const usage = {
            voiceNotesUsed: 0, // TODO: Get from voice notes service
            sleepSessionsUsed: 0, // TODO: Get from sleep tracking service
            exportsThisMonth: 0, // TODO: Get from analytics service
        };

        const daysRemaining = subscription.isTrialActive
            ? subscription.daysUntilTrialEnd
            : subscription.daysUntilRenewal;

        return {
            subscription,
            planConfig,
            usage,
            daysRemaining,
            nextBillingDate: subscription.currentPeriodEnd
        };
    }

    /**
     * Check if user has access to specific feature
     */
    async hasFeatureAccess(userId: string, feature: SubscriptionFeature): Promise<boolean> {
        const subscription = await this.findActiveSubscriptionByUserId(userId);
        if (!subscription) {
            return this.isFreeFeature(feature);
        }

        const planConfig = await this.getPlanConfig(subscription.plan);
        return planConfig?.hasFeature(feature) || this.isFreeFeature(feature);
    }

    /**
     * Check if user has reached usage limit
     */
    async hasUsageLimit(userId: string, limitType: string): Promise<boolean> {
        const subscription = await this.findActiveSubscriptionByUserId(userId);
        if (!subscription) {
            return true; // Free users have limits
        }

        const planConfig = await this.getPlanConfig(subscription.plan);
        if (!planConfig) {
            return true;
        }

        const limit = planConfig.getLimit(limitType as any);
        if (limit === -1) {
            return false; // Unlimited
        }

        // TODO: Get actual usage from respective services
        return false; // For now, assume no limits reached
    }

    /**
     * Process trial expiration
     */
    async processTrialExpiration(): Promise<void> {
        const expiredTrials = await this.subscriptionRepository.find({
            where: {
                status: SubscriptionStatus.TRIAL,
                trialEndDate: new Date()
            }
        });

        for (const subscription of expiredTrials) {
            subscription.expire();
            await this.subscriptionRepository.save(subscription);
        }
    }

    /**
     * Get all available plan configurations
     */
    async getAvailablePlans(): Promise<SubscriptionPlanConfig[]> {
        return this.planConfigRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC' }
        });
    }

    // Private helper methods

    private async findActiveSubscriptionByUserId(userId: string): Promise<Subscription | null> {
        return this.subscriptionRepository.findOne({
            where: [
                { userId, status: SubscriptionStatus.ACTIVE },
                { userId, status: SubscriptionStatus.TRIAL }
            ],
            order: { createdAt: 'DESC' }
        });
    }

    private async getPlanConfig(plan: SubscriptionPlan): Promise<SubscriptionPlanConfig | null> {
        return this.planConfigRepository.findOne({
            where: { plan, isActive: true }
        });
    }

    private async createTransaction(
        subscription: Subscription,
        transactionData: Partial<SubscriptionTransaction>
    ): Promise<SubscriptionTransaction> {
        const transaction = this.transactionRepository.create({
            subscriptionId: subscription.id,
            ...transactionData
        });

        return this.transactionRepository.save(transaction);
    }

    private isFreeFeature(feature: SubscriptionFeature): boolean {
        const freeFeatures = [
            SubscriptionFeature.BASIC_VOICE_NOTES,
            SubscriptionFeature.BASIC_SLEEP_TRACKING,
            SubscriptionFeature.BASIC_TASKS
        ];
        return freeFeatures.includes(feature);
    }
}