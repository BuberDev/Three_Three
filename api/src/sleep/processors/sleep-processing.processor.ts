import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SleepAnalysisService } from '../services/sleep-analysis.service';
import { SleepTrackingService } from '../sleep-tracking.service';

interface SleepProcessingJob {
    sleepTrackingId: string;
    audioFilePath: string;
}

@Processor('sleep-processing')
export class SleepProcessingProcessor {
    private readonly logger = new Logger(SleepProcessingProcessor.name);

    constructor(
        private readonly sleepTrackingService: SleepTrackingService,
        private readonly sleepAnalysisService: SleepAnalysisService,
    ) { }

    @Process('process-sleep-audio')
    async processSleepAudio(job: Job<SleepProcessingJob>) {
        const { sleepTrackingId, audioFilePath } = job.data;
        this.logger.log(`Processing sleep recording: ${sleepTrackingId}`);

        try {
            const sleepTracking = await this.sleepTrackingService.findById(sleepTrackingId);
            const durationMs = sleepTracking.sleepDurationHours
                ? sleepTracking.sleepDurationHours * 60 * 60 * 1000
                : 0;

            const analysisResult = await this.sleepAnalysisService.analyzeSleepAudio(
                sleepTrackingId,
                audioFilePath,
                durationMs,
            );

            await this.sleepTrackingService.applyAnalysisResults(sleepTrackingId, analysisResult);

            this.logger.log(`Sleep analysis completed for ${sleepTrackingId}. Quality: ${analysisResult.sleepQualityScore}/10`);
        } catch (error) {
            this.logger.error(`Failed to process sleep recording ${sleepTrackingId}:`, error.stack);
            await this.sleepTrackingService.markProcessingFailed(sleepTrackingId, error.message);
            throw error;
        }
    }
}
