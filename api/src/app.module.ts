import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuration - import as default exports
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { applePayConfig, googlePayConfig, stripeConfig } from './config/payments.config';
import redisConfig from './config/redis.config';
import subscriptionConfig from './config/subscription.config';

// Common
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Health
import { HealthController } from './health/health.controller';

// Auth
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// Core Modules
import { ActivitiesModule } from './activities/activities.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChatModule } from './chat/chat.module';
import { EventsModule } from './events/events.module';
import { HabitsModule } from './habits/habits.module';
import { JournalModule } from './journal/journal.module';
import { PaymentsModule } from './payments/payments.module';
import { SleepModule } from './sleep/sleep.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { VoiceNotesModule } from './voice-notes/voice-notes.module';

// Entities for TypeORM
import { DailyActivity } from './activities/entities/daily-activity.entity';
import { AIInsight } from './analytics/entities/ai-insight.entity';
import { BehavioralPattern } from './analytics/entities/behavioral-pattern.entity';
import { LifeCorrelation } from './analytics/entities/life-correlation.entity';
import { PerformanceMetric } from './analytics/entities/performance-metric.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { ChatSession } from './chat/entities/chat-session.entity';
import { Event } from './events/entities/event.entity';
import { HabitCompletion } from './habits/entities/habit-completion.entity';
import { Habit } from './habits/entities/habit.entity';
import { JournalEntry } from './journal/entities/journal-entry.entity';
import { SleepTracking } from './sleep/entities/sleep-tracking.entity';
import { SubscriptionPlanConfig } from './subscriptions/entities/subscription-plan-config.entity';
import { SubscriptionTransaction } from './subscriptions/entities/subscription-transaction.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Task } from './tasks/entities/task.entity';
import { UserSettings } from './users/entities/user-settings.entity';
import { User } from './users/entities/user.entity';
import { VoiceNote } from './voice-notes/entities/voice-note.entity';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig, stripeConfig, applePayConfig, googlePayConfig, subscriptionConfig],
            envFilePath: ['.env.local', '.env'],
        }),

        // Database
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                username: configService.get('database.username'),
                password: configService.get('database.password'),
                database: configService.get('database.name'),
                entities: [
                    User,
                    UserSettings,
                    VoiceNote,
                    Task,
                    Event,
                    DailyActivity,
                    SleepTracking,
                    JournalEntry,
                    LifeCorrelation,
                    AIInsight,
                    PerformanceMetric,
                    BehavioralPattern,
                    ChatSession,
                    ChatMessage,
                    Subscription,
                    SubscriptionPlanConfig,
                    SubscriptionTransaction,
                    Habit,
                    HabitCompletion,
                ],
                migrations: ['dist/migrations/*.js'],
                migrationsRun: true,
                synchronize: configService.get('app.nodeEnv') === 'development',
                logging: configService.get('app.nodeEnv') === 'development' ? ['query', 'error'] : ['error'],
                ssl: configService.get('database.ssl') ? {
                    rejectUnauthorized: false,
                } : false,
                // pgvector extension
                extra: {
                    // Enable pgvector extension
                    application_name: 'voice-notes-api',
                },
            }),
            inject: [ConfigService],
        }),

        // Redis/Bull for queues
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get('redis.host'),
                    port: configService.get('redis.port'),
                    password: configService.get('redis.password'),
                    db: configService.get('redis.db'),
                    tls: configService.get('redis.tls'),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            }),
            inject: [ConfigService],
        }),

        // Rate limiting
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => [{
                ttl: configService.get('app.rateLimitTtl') || 60000,
                limit: configService.get('app.rateLimitMax') || 300,
            }],
            inject: [ConfigService],
        }),

        // Scheduling for cron jobs
        ScheduleModule.forRoot(),

        // Application modules
        AuthModule,
        UsersModule,
        SubscriptionsModule,
        PaymentsModule,
        VoiceNotesModule,
        TasksModule,
        HabitsModule,
        EventsModule,
        ActivitiesModule,
        SleepModule,
        JournalModule,
        AnalyticsModule,
        AiModule,
        ChatModule,
    ],
    controllers: [
        HealthController,
    ],
    providers: [
        // Global guards
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },

        // Global filters
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },

        // Global interceptors
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },

        Logger,
    ],
})
export class AppModule {
    constructor(private readonly logger: Logger) {
        this.logger.log('🚀 Application module initialized', 'AppModule');
    }
}