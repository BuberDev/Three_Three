import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuration - import as default exports
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

// Common
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Auth
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// Core Modules
import { EventsModule } from './events/events.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { VoiceNotesModule } from './voice-notes/voice-notes.module';

// Entities for TypeORM
import { Event } from './events/entities/event.entity';
import { Task } from './tasks/entities/task.entity';
import { UserSettings } from './users/entities/user-settings.entity';
import { User } from './users/entities/user.entity';
import { VoiceNote } from './voice-notes/entities/voice-note.entity';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig],
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
                entities: [User, UserSettings, VoiceNote, Task, Event],
                migrations: ['dist/migrations/*.js'],
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
                limit: configService.get('app.rateLimitMax') || 10,
            }],
            inject: [ConfigService],
        }),

        // Scheduling for cron jobs
        ScheduleModule.forRoot(),

        // Core modules
        AuthModule,
        UsersModule,
        VoiceNotesModule,
        TasksModule,
        EventsModule,
    ],
    providers: [
        // Global guards
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
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