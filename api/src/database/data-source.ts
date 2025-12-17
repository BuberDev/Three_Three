import { DataSource } from 'typeorm';
import { DailyActivity } from '../activities/entities/daily-activity.entity';
import { AIInsight } from '../analytics/entities/ai-insight.entity';
import { BehavioralPattern } from '../analytics/entities/behavioral-pattern.entity';
import { LifeCorrelation } from '../analytics/entities/life-correlation.entity';
import { PerformanceMetric } from '../analytics/entities/performance-metric.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { Event } from '../events/entities/event.entity';
import { JournalEntry } from '../journal/entities/journal-entry.entity';
import { SleepEvent } from '../sleep/entities/sleep-event.entity';
import { SleepTracking } from '../sleep/entities/sleep-tracking.entity';
import { SubscriptionPlanConfig } from '../subscriptions/entities/subscription-plan-config.entity';
import { SubscriptionTransaction } from '../subscriptions/entities/subscription-transaction.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserSettings } from '../users/entities/user-settings.entity';
import { User } from '../users/entities/user.entity';
import { VoiceNote } from '../voice-notes/entities/voice-note.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'three_three',
    entities: [
        User,
        UserSettings,
        VoiceNote,
        Task,
        Event,
        DailyActivity,
        SleepTracking,
        SleepEvent,
        JournalEntry,
        LifeCorrelation,
        AIInsight,
        PerformanceMetric,
        BehavioralPattern,
        ChatSession,
        ChatMessage,
        Subscription,
        SubscriptionPlanConfig,
        SubscriptionTransaction
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false, // Never use in production
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});