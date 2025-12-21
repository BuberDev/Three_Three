import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Habit } from './habit.entity';

@Entity('habit_completions')
@Index(['habitId', 'completedAt'])
@Index(['userId', 'completedAt'])
export class HabitCompletion extends BaseEntity {
    @Column()
    @Index()
    habitId: string;

    @ManyToOne(() => Habit, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'habitId' })
    habit: Habit;

    @Column()
    @Index()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'date' })
    @Index()
    completedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'int', nullable: true })
    rating: number; // 1-5 satisfaction rating

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>; // For custom tracking data
}