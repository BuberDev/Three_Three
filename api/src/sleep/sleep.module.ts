import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyActivity } from '../activities/entities/daily-activity.entity';
import { VoiceNote } from '../voice-notes/entities/voice-note.entity';
import { SleepEvent } from './entities/sleep-event.entity';
import { SleepTracking } from './entities/sleep-tracking.entity';
import { SleepAnalysisService } from './services/sleep-analysis.service';
import { SleepCorrelationService } from './services/sleep-correlation.service';
import { SleepTrackingController } from './sleep-tracking.controller';
import { SleepTrackingService } from './sleep-tracking.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SleepTracking,
            SleepEvent,
            VoiceNote,
            DailyActivity
        ])
    ],
    controllers: [SleepTrackingController],
    providers: [
        SleepTrackingService,
        SleepAnalysisService,
        SleepCorrelationService
    ],
    exports: [
        SleepTrackingService,
        SleepAnalysisService,
        SleepCorrelationService
    ],
})
export class SleepModule { }