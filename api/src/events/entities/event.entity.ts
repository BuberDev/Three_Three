import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum EventType {
    USER_REGISTERED = 'user_registered',
    USER_LOGIN = 'user_login',
    ONBOARDING_COMPLETED = 'onboarding_completed',
    VOICE_NOTE_UPLOADED = 'voice_note_uploaded',
    VOICE_NOTE_PROCESSED = 'voice_note_processed',
    VOICE_NOTE_PROCESSING_FAILED = 'voice_note_processing_failed',
    TASK_CREATED = 'task_created',
    TASK_COMPLETED = 'task_completed',
    TASK_OVERDUE = 'task_overdue',
    DAILY_ENTRY_CREATED = 'daily_entry_created',
    GOAL_ACHIEVED = 'goal_achieved',
    INSIGHT_GENERATED = 'insight_generated',
    PERSONALIZATION_UPDATED = 'personalization_updated',
    HABIT_CREATED = 'habit_created',
    HABIT_UPDATED = 'habit_updated',
    HABIT_DELETED = 'habit_deleted',
    HABIT_COMPLETED = 'habit_completed',
    HABIT_UNCOMPLETED = 'habit_uncompleted',
    HABIT_STREAK_MILESTONE = 'habit_streak_milestone',
}

export enum EventStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    PROCESSED = 'processed',
    FAILED = 'failed',
    RETRYING = 'retrying',
}

@Entity('events')
@Index(['type', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['status'])
export class Event extends BaseEntity {
    @Column({
        type: 'enum',
        enum: EventType,
    })
    type: EventType;

    @Column({ name: 'user_id', nullable: true })
    userId?: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, any>;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @Column({
        type: 'enum',
        enum: EventStatus,
        default: EventStatus.PENDING,
    })
    status: EventStatus;

    @Column({ nullable: true })
    processingStartedAt?: Date;

    @Column({ nullable: true })
    processingCompletedAt?: Date;

    @Column({ type: 'text', nullable: true })
    processingError?: string;

    @Column({ type: 'int', default: 0 })
    retryCount: number;

    @Column({ nullable: true })
    nextRetryAt?: Date;

    @Column({ length: 255, nullable: true })
    correlationId?: string;

    @Column({ length: 255, nullable: true })
    sourceService?: string;

    // Relations
    @ManyToOne(() => User, (user) => user.events, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    // Virtual properties
    get processingDuration(): number | null {
        if (this.processingStartedAt && this.processingCompletedAt) {
            return (
                this.processingCompletedAt.getTime() -
                this.processingStartedAt.getTime()
            );
        }
        return null;
    }

    get isRetryable(): boolean {
        return (
            this.status === EventStatus.FAILED &&
            this.retryCount < 3 &&
            (!this.nextRetryAt || this.nextRetryAt <= new Date())
        );
    }
}