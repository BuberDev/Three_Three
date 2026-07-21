import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { AudioTranscriptionService } from '../../audio-transcription/audio-transcription.service';
import { SleepEvent, SleepEventIntensity, SleepEventType } from '../entities/sleep-event.entity';

interface AudioSegment {
    startTime: number; // seconds
    endTime: number; // seconds
    avgVolumeDb: number; // real mean volume from ffmpeg's volumedetect filter
}

interface AudioAnalysisResult {
    events: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[];
    snoringDetected: boolean;
    snoringIntensity: any; // Will match SnoringIntensity enum
    sleepTalkingDetected: boolean;
    sleepTalkingFrequency: number;
    sleepQualityScore: number;
    awakeningsCount: number;
    sleepEfficiency: number;
    analysisMetadata: any;
}

@Injectable()
export class SleepAnalysisService {
    private readonly logger = new Logger(SleepAnalysisService.name);
    private readonly ollama: OpenAI;
    private readonly ollamaModel: string;

    constructor(
        @InjectRepository(SleepEvent)
        private sleepEventsRepository: Repository<SleepEvent>,
        private configService: ConfigService,
        private readonly audioTranscriptionService: AudioTranscriptionService,
    ) {
        this.ollamaModel = this.configService.get<string>('app.ollama.model');
        this.ollama = new OpenAI({
            apiKey: 'ollama',
            baseURL: this.configService.get<string>('app.ollama.baseUrl'),
        });
    }

    /**
     * Main method: Analyze sleep audio recording and return detailed events
     */
    async analyzeSleepAudio(
        sleepTrackingId: string,
        audioFilePath: string,
        recordingDurationMs: number,
    ): Promise<AudioAnalysisResult> {
        try {
            this.logger.log(`Starting sleep audio analysis for tracking: ${sleepTrackingId}`);

            // 1. Segment audio into 30-second chunks
            const segments = await this.segmentAudio(audioFilePath, recordingDurationMs);

            // 2. Analyze each segment
            const allEvents: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[] = [];

            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                const segmentEvents = await this.analyzeAudioSegment(
                    sleepTrackingId,
                    segment,
                    i
                );
                allEvents.push(...segmentEvents);
            }

            // 3. Process sleep talking with Whisper transcription
            const sleepTalkingEvents = allEvents.filter(e => e.eventType === SleepEventType.SLEEP_TALKING);
            for (const event of sleepTalkingEvents) {
                if (event.audioSegmentStart !== undefined && event.audioSegmentEnd !== undefined) {
                    const transcription = await this.transcribeSleepTalking(
                        audioFilePath,
                        event.audioSegmentStart,
                        event.audioSegmentEnd
                    );
                    event.transcription = transcription;
                }
            }

            // 4. Calculate overall metrics
            const analysis = this.calculateOverallMetrics(allEvents, recordingDurationMs);

            // Persisting events/metrics is the caller's responsibility
            // (SleepTrackingService.applyAnalysisResults) — this service only
            // computes the analysis.
            this.logger.log(`Sleep analysis completed. Found ${allEvents.length} events`);

            return analysis;

        } catch (error) {
            this.logger.error(`Sleep analysis failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Segment audio into 30-second chunks for analysis
     */
    private async segmentAudio(audioFilePath: string, _durationMs: number): Promise<AudioSegment[]> {
        const volumeSegments = await this.audioTranscriptionService.analyzeVolumeSegments(audioFilePath, 30);
        return volumeSegments.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            avgVolumeDb: s.avgVolumeDb,
        }));
    }

    /**
     * Analyze individual 30-second audio segment
     */
    private async analyzeAudioSegment(
        sleepTrackingId: string,
        segment: AudioSegment,
        segmentIndex: number,
    ): Promise<Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[]> {
        const events: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[] = [];
        const avgVolumeDb = segment.avgVolumeDb;
        const segmentDuration = segment.endTime - segment.startTime;

        // Real audio, simple heuristic thresholds (not ML, not clinically
        // validated — see docs/superpowers/specs/2026-07-21-real-audio-transcription-design.md).
        // Snoring: moderately loud, sustained low-frequency-ish rumble —
        // approximated here by a mid volume band without the sharper energy
        // of speech.
        if (avgVolumeDb > -35 && avgVolumeDb <= -15) {
            const intensity = avgVolumeDb > -22 ? SleepEventIntensity.HIGH :
                avgVolumeDb > -28 ? SleepEventIntensity.MODERATE :
                    SleepEventIntensity.LOW;

            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.SNORING,
                intensity,
                durationSeconds: segmentDuration,
                confidenceScore: 0.6,
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    volume: avgVolumeDb,
                    pattern: intensity === SleepEventIntensity.HIGH ? 'irregular' : 'regular',
                },
            });
        }

        // Sleep talking: the loudest, sharpest volume spikes — most likely
        // to be actual speech rather than snoring/breathing.
        if (avgVolumeDb > -15) {
            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.SLEEP_TALKING,
                intensity: SleepEventIntensity.MODERATE,
                durationSeconds: segmentDuration,
                confidenceScore: 0.6,
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    volume: avgVolumeDb,
                },
            });
        }

        // Movement: brief, moderate volume that isn't sustained enough to be
        // snoring or speech — approximated by a quieter band than both.
        if (avgVolumeDb > -50 && avgVolumeDb <= -35) {
            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.MOVEMENT,
                intensity: SleepEventIntensity.LOW,
                durationSeconds: Math.min(segmentDuration, 5),
                confidenceScore: 0.5,
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    movement_type: 'position_change',
                    volume: avgVolumeDb,
                },
            });
        }

        return events;
    }

    /**
     * Use OpenAI Whisper to transcribe sleep talking segments
     */
    private async transcribeSleepTalking(
        audioFilePath: string,
        startTime: number,
        endTime: number,
    ): Promise<string> {
        let segmentPath: string | null = null;
        try {
            segmentPath = await this.audioTranscriptionService.extractSegment(audioFilePath, startTime, endTime);
            return await this.audioTranscriptionService.transcribe(segmentPath, 'pl');
        } catch (error) {
            this.logger.warn(`Transcription failed: ${error.message}`);
            return '';
        } finally {
            if (segmentPath) {
                const fs = await import('fs/promises');
                await fs.unlink(segmentPath).catch(() => undefined);
            }
        }
    }

    /**
     * Calculate overall sleep metrics from events
     */
    private calculateOverallMetrics(
        events: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[],
        durationMs: number,
    ): AudioAnalysisResult {
        const snoringEvents = events.filter(e => e.eventType === SleepEventType.SNORING);
        const sleepTalkingEvents = events.filter(e => e.eventType === SleepEventType.SLEEP_TALKING);
        const movementEvents = events.filter(e => e.eventType === SleepEventType.MOVEMENT);

        const totalInterruptions = sleepTalkingEvents.length + movementEvents.length;
        const durationHours = durationMs / (1000 * 60 * 60);

        // Calculate sleep quality based on events
        let quality = 8; // Base quality

        // Deduct for snoring
        if (snoringEvents.length > 0) {
            const avgSnoringIntensity = snoringEvents.reduce((acc, event) => {
                const intensityScore = {
                    [SleepEventIntensity.VERY_LOW]: 1,
                    [SleepEventIntensity.LOW]: 2,
                    [SleepEventIntensity.MODERATE]: 3,
                    [SleepEventIntensity.HIGH]: 4,
                    [SleepEventIntensity.VERY_HIGH]: 5,
                }[event.intensity || SleepEventIntensity.LOW];
                return acc + intensityScore;
            }, 0) / snoringEvents.length;

            quality -= avgSnoringIntensity * 0.5;
        }

        // Deduct for interruptions
        quality -= Math.min(3, totalInterruptions * 0.3);

        // Adjust for sleep duration
        if (durationHours < 6) quality -= 1;
        if (durationHours > 9) quality -= 0.5;

        // Determine snoring intensity
        const highIntensitySnoringCount = snoringEvents.filter(e =>
            e.intensity === SleepEventIntensity.HIGH || e.intensity === SleepEventIntensity.VERY_HIGH
        ).length;

        let snoringIntensity = 'NONE';
        if (snoringEvents.length > 0) {
            if (highIntensitySnoringCount > snoringEvents.length / 2) {
                snoringIntensity = 'HEAVY';
            } else if (snoringEvents.length > 10) {
                snoringIntensity = 'MODERATE';
            } else {
                snoringIntensity = 'LIGHT';
            }
        }

        // Calculate sleep efficiency
        const awakenings = events.filter(e => e.eventType === SleepEventType.SLEEP_INTERRUPTION).length;
        const sleepEfficiency = Math.max(50, 100 - (awakenings * 5) - (snoringEvents.length * 2));

        return {
            events,
            snoringDetected: snoringEvents.length > 0,
            snoringIntensity,
            sleepTalkingDetected: sleepTalkingEvents.length > 0,
            sleepTalkingFrequency: sleepTalkingEvents.length,
            sleepQualityScore: Math.max(1, Math.min(10, quality)),
            awakeningsCount: awakenings,
            sleepEfficiency: Math.round(sleepEfficiency),
            analysisMetadata: {
                totalSnoringEvents: snoringEvents.length,
                totalSleepTalkingEvents: sleepTalkingEvents.length,
                totalMovementEvents: movementEvents.length,
                analysisDate: new Date().toISOString(),
                durationAnalyzed: durationMs,
            },
        };
    }

    /**
     * Get sleep events for a specific sleep tracking record
     */
    async getSleepEvents(sleepTrackingId: string): Promise<SleepEvent[]> {
        return this.sleepEventsRepository.find({
            where: { sleepTrackingId },
            order: { eventTime: 'ASC' },
        });
    }
}
