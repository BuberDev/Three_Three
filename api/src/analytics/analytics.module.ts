import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyActivity } from '../activities/entities/daily-activity.entity';
import { JournalEntry } from '../journal/entities/journal-entry.entity';
import { SleepTracking } from '../sleep/entities/sleep-tracking.entity';
import { VoiceNote } from '../voice-notes/entities/voice-note.entity';
import { AnalyticsController } from './controllers/analytics.controller';
import { AIInsight } from './entities/ai-insight.entity';
import { BehavioralPattern } from './entities/behavioral-pattern.entity';
import { LifeCorrelation } from './entities/life-correlation.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { AnalyticsService } from './services/analytics.service';
import { CorrelationService } from './services/correlation.service';
import { InsightService } from './services/insight.service';
import { PatternService } from './services/pattern.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PerformanceMetric,
            LifeCorrelation,
            BehavioralPattern,
            AIInsight,
            DailyActivity,
            SleepTracking,
            JournalEntry,
            VoiceNote,
        ]),
    ],
    controllers: [AnalyticsController],
    providers: [
        AnalyticsService,
        CorrelationService,
        PatternService,
        InsightService,
    ],
    exports: [
        AnalyticsService,
        CorrelationService,
        PatternService,
        InsightService,
    ],
})
export class AnalyticsModule { }