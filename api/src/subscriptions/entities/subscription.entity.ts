import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan, SubscriptionStatus } from '../enums/subscription.enums';
import { SubscriptionTransaction } from './subscription-transaction.entity';

@Entity('subscriptions')
@Index(['userId', 'status'])
@Index(['trialEndDate'])
@Index(['currentPeriodEnd'])
export class Subscription extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'enum',
        enum: SubscriptionPlan,
        default: SubscriptionPlan.FREE_TRIAL
    })
    plan: SubscriptionPlan;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.TRIAL
    })
    status: SubscriptionStatus;

    @Column({ type: 'timestamp', nullable: true })
    trialStartDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    trialEndDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodStart: Date;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodEnd: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;

    @Column({ length: 3, default: 'USD' })
    currency: string;

    @Column({ nullable: true })
    stripeCustomerId?: string;

    @Column({ nullable: true })
    stripeSubscriptionId?: string;

    @Column({ nullable: true })
    stripePriceId?: string;

    @Column({ type: 'timestamp', nullable: true })
    canceledAt?: Date;

    @Column({ nullable: true })
    cancelReason?: string;

    @Column({ default: true })
    autoRenew: boolean;

    @Column({ type: 'jsonb', default: {} })
    metadata: {
        source?: string; // web, mobile, admin
        couponCode?: string;
        referralCode?: string;
        upgradeReason?: string;
        cancelationFeedback?: string;
        paymentFailures?: Array<{
            date: string;
            reason: string;
            amount: number;
        }>;
    };

    @OneToMany(() => SubscriptionTransaction, transaction => transaction.subscription)
    transactions: SubscriptionTransaction[];

    // Helper methods
    get isActive(): boolean {
        return this.status === SubscriptionStatus.ACTIVE;
    }

    get isTrialActive(): boolean {
        if (this.status !== SubscriptionStatus.TRIAL) return false;
        if (!this.trialEndDate) return false;
        return new Date() < this.trialEndDate;
    }

    get isExpired(): boolean {
        if (!this.currentPeriodEnd) return false;
        return new Date() > this.currentPeriodEnd;
    }

    get daysUntilTrialEnd(): number {
        if (!this.trialEndDate || this.status !== SubscriptionStatus.TRIAL) return 0;
        const now = new Date();
        const end = new Date(this.trialEndDate);
        const diffTime = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    get daysUntilRenewal(): number {
        if (!this.currentPeriodEnd || this.status !== SubscriptionStatus.ACTIVE) return 0;
        const now = new Date();
        const end = new Date(this.currentPeriodEnd);
        const diffTime = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    startTrial(): void {
        this.status = SubscriptionStatus.TRIAL;
        this.trialStartDate = new Date();
        this.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        this.plan = SubscriptionPlan.FREE_TRIAL;
    }

    activatePaidSubscription(plan: SubscriptionPlan, amount: number, currency = 'USD'): void {
        this.status = SubscriptionStatus.ACTIVE;
        this.plan = plan;
        this.amount = amount;
        this.currency = currency;
        this.currentPeriodStart = new Date();

        // Set period end based on plan
        const periodEnd = new Date();
        if (plan === SubscriptionPlan.MONTHLY_PRO) {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else if (plan === SubscriptionPlan.ANNUAL_PRO) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }
        this.currentPeriodEnd = periodEnd;
    }

    cancel(reason?: string): void {
        this.status = SubscriptionStatus.CANCELED;
        this.canceledAt = new Date();
        this.cancelReason = reason;
        this.autoRenew = false;
    }

    suspend(): void {
        this.status = SubscriptionStatus.SUSPENDED;
    }

    expire(): void {
        this.status = SubscriptionStatus.EXPIRED;
        this.autoRenew = false;
    }
}