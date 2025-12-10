import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { VoiceNote } from '../../voice-notes/entities/voice-note.entity';

export enum ActivityType {
    WORK = 'work',
    EXERCISE = 'exercise',
    MEAL = 'meal',
    SOCIAL = 'social',
    PERSONAL = 'personal',
    HEALTH = 'health',
    TRAVEL = 'travel',
    SLEEP = 'sleep',
    ENTERTAINMENT = 'entertainment',
    LEARNING = 'learning',
}

export enum MoodLevel {
    GREAT = 'great',
    GOOD = 'good',
    NEUTRAL = 'neutral',
    BAD = 'bad',
    TERRIBLE = 'terrible',
}

@Entity('daily_activities')
@Index(['userId', 'date'])
@Index(['activityType'])
@Index(['createdAt'])
export class DailyActivity extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'voice_note_id', nullable: true })
    voiceNoteId?: string;

    @Column({ type: 'date' })
    date: string;

    @Column({
        name: 'activity_type',
        type: 'enum',
        enum: ActivityType,
    })
    activityType: ActivityType;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'duration_minutes', nullable: true })
    durationMinutes?: number;

    @Column({ length: 100, nullable: true })
    location?: string;

    @Column({ name: 'people_involved', type: 'jsonb', default: [] })
    peopleInvolved: string[];

    @Column({
        name: 'mood_before',
        type: 'enum',
        enum: MoodLevel,
        nullable: true,
    })
    moodBefore?: MoodLevel;

    @Column({
        name: 'mood_after',
        type: 'enum',
        enum: MoodLevel,
        nullable: true,
    })
    moodAfter?: MoodLevel;

    @Column({ name: 'energy_level', nullable: true })
    energyLevel?: number; // 1-10

    @Column({ name: 'productivity_rating', nullable: true })
    productivityRating?: number; // 1-10

    @Column({ type: 'jsonb', default: [] })
    tags: string[];

    @Column({ name: 'extracted_metadata', type: 'jsonb', default: {} })
    extractedMetadata: Record<string, any>;

    // Relations
    @ManyToOne(() => User, (user) => user.dailyActivities, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToOne(() => VoiceNote, { nullable: true })
    @JoinColumn({ name: 'voice_note_id' })
    voiceNote?: VoiceNote;

    // Helper methods
    get hasLocationData(): boolean {
        return !!this.location;
    }

    get hasMoodData(): boolean {
        return !!(this.moodBefore || this.moodAfter);
    }

    get hasPerformanceData(): boolean {
        return !!(this.energyLevel || this.productivityRating);
    }

    get moodChange(): number | null {
        if (!this.moodBefore || !this.moodAfter) return null;

        const moodValues = {
            [MoodLevel.TERRIBLE]: 1,
            [MoodLevel.BAD]: 2,
            [MoodLevel.NEUTRAL]: 3,
            [MoodLevel.GOOD]: 4,
            [MoodLevel.GREAT]: 5,
        };

        return moodValues[this.moodAfter] - moodValues[this.moodBefore];
    }
}