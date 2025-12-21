import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum HabitFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}

export enum HabitCategory {
    HEALTH = 'health',
    PRODUCTIVITY = 'productivity',
    LEARNING = 'learning',
    PERSONAL = 'personal',
    FITNESS = 'fitness',
    MINDFULNESS = 'mindfulness',
    SOCIAL = 'social',
    FINANCIAL = 'financial',
}

export enum HabitStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

@Entity('habits')
@Index(['userId', 'status'])
@Index(['userId', 'category'])
@Index(['userId', 'frequency'])
export class Habit extends BaseEntity {
    @Column()
    @Index()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: HabitFrequency,
        default: HabitFrequency.DAILY,
    })
    frequency: HabitFrequency;

    @Column({
        type: 'enum',
        enum: HabitCategory,
        default: HabitCategory.PERSONAL,
    })
    category: HabitCategory;

    @Column({
        type: 'enum',
        enum: HabitStatus,
        default: HabitStatus.ACTIVE,
    })
    status: HabitStatus;

    @Column({ type: 'int', default: 0 })
    currentStreak: number;

    @Column({ type: 'int', default: 0 })
    longestStreak: number;

    @Column({ type: 'int', default: 0 })
    totalCompletions: number;

    @Column({ type: 'date', nullable: true })
    lastCompletedAt: Date;

    @Column({ type: 'int', nullable: true })
    targetDays: number; // For weekly/monthly habits

    @Column({ type: 'json', nullable: true })
    reminderSettings: {
        enabled: boolean;
        time: string; // HH:MM format
        days: number[]; // 0-6, Sunday = 0
    };

    @Column({ type: 'json', nullable: true })
    customFields: Record<string, any>;

    // Computed properties
    get completionRate(): number {
        const daysSinceCreated = Math.floor(
            (new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreated === 0) return 0;
        return Math.round((this.totalCompletions / daysSinceCreated) * 100);
    }

    get isCompletedToday(): boolean {
        if (!this.lastCompletedAt) return false;
        const today = new Date();
        const lastCompleted = new Date(this.lastCompletedAt);
        return (
            today.getFullYear() === lastCompleted.getFullYear() &&
            today.getMonth() === lastCompleted.getMonth() &&
            today.getDate() === lastCompleted.getDate()
        );
    }
}