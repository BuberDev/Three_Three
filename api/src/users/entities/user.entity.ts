import { Exclude } from 'class-transformer';
import {
    Column,
    Entity,
    Index,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { DailyActivity } from '../../activities/entities/daily-activity.entity';
import { AIInsight } from '../../analytics/entities/ai-insight.entity';
import { BehavioralPattern } from '../../analytics/entities/behavioral-pattern.entity';
import { LifeCorrelation } from '../../analytics/entities/life-correlation.entity';
import { PerformanceMetric } from '../../analytics/entities/performance-metric.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { Event } from '../../events/entities/event.entity';
import { JournalEntry } from '../../journal/entities/journal-entry.entity';
import { SleepTracking } from '../../sleep/entities/sleep-tracking.entity';
import { Task } from '../../tasks/entities/task.entity';
import { VoiceNote } from '../../voice-notes/entities/voice-note.entity';
import { UserSettings } from './user-settings.entity';

export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    APPLE = 'apple',
}

@Entity('users')
@Index(['email', 'authProvider'], { unique: true })
export class User extends BaseEntity {
    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ nullable: true })
    @Exclude({ toPlainOnly: true })
    password?: string;

    @Column({
        type: 'enum',
        enum: AuthProvider,
        default: AuthProvider.LOCAL,
    })
    authProvider: AuthProvider;

    @Column({ nullable: true, length: 255 })
    externalId?: string;

    @Column({ nullable: true, length: 100 })
    firstName?: string;

    @Column({ nullable: true, length: 100 })
    lastName?: string;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isOnboardingCompleted: boolean;

    @Column({ nullable: true })
    @Exclude({ toPlainOnly: true })
    refreshToken?: string;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    @Column({ type: 'jsonb', default: {} })
    preferences: {
        timezone?: string;
        dateFormat?: string;
        timeFormat?: '12h' | '24h';
        language?: string;
        notifications?: {
            insights?: boolean;
            dailyReminders?: boolean;
            weeklyReports?: boolean;
            correlationAlerts?: boolean;
        };
        privacy?: {
            dataRetention?: number; // days
            shareAnonymousData?: boolean;
            allowAIAnalysis?: boolean;
        };
        tracking?: {
            autoDetectActivities?: boolean;
            sleepTrackingEnabled?: boolean;
            voiceAnalysisEnabled?: boolean;
        };
    };

    @Column({ type: 'jsonb', default: {} })
    metadata: {
        onboardingCompleted?: boolean;
        lastLoginAt?: string;
        deviceInfo?: {
            platform?: string;
            version?: string;
        };
        analyticsConsent?: boolean;
        dataExportRequests?: Array<{
            requestedAt: string;
            status: 'pending' | 'processing' | 'completed';
            downloadUrl?: string;
        }>;
    };

    // Relations
    @OneToOne(() => UserSettings, (settings) => settings.user, {
        cascade: true,
        eager: false,
    })
    settings: UserSettings;

    @OneToMany(() => VoiceNote, (voiceNote) => voiceNote.user)
    voiceNotes: VoiceNote[];

    @OneToMany(() => Task, (task) => task.user)
    tasks: Task[];

    @OneToMany(() => Event, (event) => event.user)
    events: Event[];

    @OneToMany(() => DailyActivity, (activity) => activity.user)
    dailyActivities: DailyActivity[];

    @OneToMany(() => SleepTracking, (sleep) => sleep.user)
    sleepSessions: SleepTracking[];

    @OneToMany(() => JournalEntry, (entry) => entry.user)
    journalEntries: JournalEntry[];

    @OneToMany(() => PerformanceMetric, (metric) => metric.user)
    performanceMetrics: PerformanceMetric[];

    @OneToMany(() => LifeCorrelation, (correlation) => correlation.user)
    lifeCorrelations: LifeCorrelation[];

    @OneToMany(() => BehavioralPattern, (pattern) => pattern.user)
    behavioralPatterns: BehavioralPattern[];

    @OneToMany(() => AIInsight, (insight) => insight.user)
    aiInsights: AIInsight[];

    @OneToMany(() => ChatSession, (session) => session.user)
    chatSessions: ChatSession[];

    @OneToMany(() => ChatMessage, (message) => message.user)
    chatMessages: ChatMessage[];

    // Virtual properties
    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }

    get hasCompletedOnboarding(): boolean {
        return this.metadata?.onboardingCompleted === true || this.isOnboardingCompleted;
    }

    // Helper methods
    updateLastLogin(): void {
        this.lastLoginAt = new Date();
        this.metadata = {
            ...this.metadata,
            lastLoginAt: new Date().toISOString(),
        };
    }

    updatePreferences(newPreferences: Partial<typeof this.preferences>): void {
        this.preferences = {
            ...this.preferences,
            ...newPreferences,
        };
    }
}