import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SubscriptionFeature, SubscriptionPlan } from '../enums/subscription.enums';

@Entity('subscription_plans')
@Index(['plan'], { unique: true })
export class SubscriptionPlanConfig extends BaseEntity {
    @Column({
        type: 'enum',
        enum: SubscriptionPlan,
        unique: true
    })
    plan: SubscriptionPlan;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ length: 3, default: 'USD' })
    currency: string;

    @Column({ type: 'enum', enum: ['month', 'year'] })
    billingPeriod: 'month' | 'year';

    @Column({ nullable: true })
    stripePriceId?: string;

    @Column({ type: 'simple-array' })
    features: SubscriptionFeature[];

    @Column({ type: 'jsonb', default: {} })
    limits: {
        voiceNotes?: number; // -1 for unlimited
        sleepSessions?: number;
        dataRetentionDays?: number;
        analyticsHistory?: number; // months
        exportsPerMonth?: number;
    };

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ type: 'jsonb', default: {} })
    metadata: {
        highlightFeature?: string;
        popularBadge?: boolean;
        trialIncluded?: boolean;
        setupFee?: number;
    };

    // Helper methods
    hasFeature(feature: SubscriptionFeature): boolean {
        return this.features.includes(feature);
    }

    getLimit(limitType: keyof typeof this.limits): number {
        return this.limits[limitType] || 0;
    }

    isUnlimited(limitType: keyof typeof this.limits): boolean {
        return this.getLimit(limitType) === -1;
    }
}