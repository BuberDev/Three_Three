import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum TaskSource {
    MANUAL = 'manual',
    VOICE_NOTE = 'voice_note',
    AI_SUGGESTION = 'ai_suggestion',
    RECURRING = 'recurring',
}

@Entity('tasks')
@Index(['userId', 'status'])
@Index(['userId', 'dueDate'])
@Index(['priority', 'status'])
export class Task extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ length: 500 })
    title: string;

    @Column('text', { nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.TODO,
    })
    status: TaskStatus;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    priority: TaskPriority;

    @Column({
        type: 'enum',
        enum: TaskSource,
        default: TaskSource.MANUAL,
    })
    source: TaskSource;

    @Column({ nullable: true })
    dueDate?: Date;

    @Column({ nullable: true })
    completedAt?: Date;

    @Column({ type: 'int', default: 0 })
    estimatedMinutes: number;

    @Column({ type: 'int', nullable: true })
    actualMinutes?: number;

    @Column({ type: 'jsonb', default: [] })
    tags: string[];

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    // Source references
    @Column({ nullable: true })
    sourceVoiceNoteId?: string;

    @Column({ nullable: true })
    sourceDailyEntryId?: string;

    // Recurring task settings
    @Column({ nullable: true })
    parentTaskId?: string;

    @Column({ type: 'jsonb', nullable: true })
    recurringPattern?: {
        type: 'daily' | 'weekly' | 'monthly';
        interval: number;
        endDate?: Date;
    };

    @Column({ default: false })
    isRecurring: boolean;

    // Progress tracking
    @Column({ type: 'float', default: 0, comment: 'Progress percentage 0-100' })
    progressPercentage: number;

    @Column({ type: 'jsonb', default: [] })
    subtasks: Array<{
        id: string;
        title: string;
        completed: boolean;
        completedAt?: Date;
    }>;

    // Relations
    @ManyToOne(() => User, (user) => user.tasks, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Virtual properties
    get isOverdue(): boolean {
        return (
            this.dueDate &&
            this.status !== TaskStatus.COMPLETED &&
            this.dueDate < new Date()
        );
    }

    get timeToDeadline(): number | null {
        if (!this.dueDate) return null;
        return this.dueDate.getTime() - Date.now();
    }

    get completionTime(): number | null {
        if (!this.completedAt) return null;
        return this.completedAt.getTime() - this.createdAt.getTime();
    }

    get isCompleted(): boolean {
        return this.status === TaskStatus.COMPLETED;
    }

    get completed(): boolean {
        return this.status === TaskStatus.COMPLETED;
    }

    get urgencyScore(): number {
        let score = 0;

        // Priority weight
        switch (this.priority) {
            case TaskPriority.URGENT:
                score += 10;
                break;
            case TaskPriority.HIGH:
                score += 7;
                break;
            case TaskPriority.MEDIUM:
                score += 4;
                break;
            case TaskPriority.LOW:
                score += 1;
                break;
        }

        // Deadline weight
        if (this.dueDate) {
            const hoursToDeadline = this.timeToDeadline / (1000 * 60 * 60);
            if (hoursToDeadline < 24) score += 5;
            else if (hoursToDeadline < 72) score += 3;
            else if (hoursToDeadline < 168) score += 1; // 1 week
        }

        return score;
    }
}