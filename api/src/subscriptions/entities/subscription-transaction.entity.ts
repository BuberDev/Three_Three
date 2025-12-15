import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Subscription } from './subscription.entity';

export enum TransactionType {
    PAYMENT = 'payment',
    REFUND = 'refund',
    CHARGEBACK = 'chargeback',
    DISPUTE = 'dispute'
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELED = 'canceled'
}

@Entity('subscription_transactions')
@Index(['subscriptionId'])
@Index(['status'])
@Index(['createdAt'])
export class SubscriptionTransaction extends BaseEntity {
    @Column({ name: 'subscription_id' })
    subscriptionId: string;

    @ManyToOne(() => Subscription, subscription => subscription.transactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subscription_id' })
    subscription: Subscription;

    @Column({
        type: 'enum',
        enum: TransactionType
    })
    type: TransactionType;

    @Column({
        type: 'enum',
        enum: TransactionStatus
    })
    status: TransactionStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 3 })
    currency: string;

    @Column({ nullable: true })
    stripePaymentIntentId?: string;

    @Column({ nullable: true })
    stripeChargeId?: string;

    @Column({ nullable: true })
    failureReason?: string;

    @Column({ type: 'jsonb', default: {} })
    metadata: {
        paymentMethod?: string;
        last4?: string;
        brand?: string;
        country?: string;
        receipt_url?: string;
        invoice_id?: string;
    };

    @Column({ type: 'timestamp', nullable: true })
    processedAt?: Date;
}