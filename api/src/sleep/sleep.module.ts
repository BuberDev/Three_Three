import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyActivity } from '../activities/entities/daily-activity.entity';
import { AudioTranscriptionModule } from '../audio-transcription/audio-transcription.module';
import { VoiceNote } from '../voice-notes/entities/voice-note.entity';
import { SleepEvent } from './entities/sleep-event.entity';
import { SleepTracking } from './entities/sleep-tracking.entity';
import { SleepProcessingProcessor } from './processors/sleep-processing.processor';
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
        ]),
        BullModule.registerQueue({
            name: 'sleep-processing',
        }),
        AudioTranscriptionModule,
    ],
    controllers: [SleepTrackingController],
    providers: [
        SleepTrackingService,
        SleepAnalysisService,
        SleepCorrelationService,
        SleepProcessingProcessor,
    ],
    exports: [
        SleepTrackingService,
        SleepAnalysisService,
        SleepCorrelationService
    ],
})
export class SleepModule { }