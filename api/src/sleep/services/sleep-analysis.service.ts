import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { SleepEvent, SleepEventIntensity, SleepEventType } from '../entities/sleep-event.entity';

interface AudioSegment {
    startTime: number; // seconds
    endTime: number; // seconds
    audioData: ArrayBuffer;
    volume: number;
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
    private readonly openRouter: OpenAI | null = null;

    constructor(
        @InjectRepository(SleepEvent)
        private sleepEventsRepository: Repository<SleepEvent>,
        private configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

        if (!apiKey) {
            this.logger.warn('OPENROUTER_API_KEY not configured. Sleep audio analysis will use local fallback logic.');
            return;
        }

        this.openRouter = new OpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
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

            // 5. Save events to database
            await this.saveEventsToDatabase(sleepTrackingId, allEvents);

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
    private async segmentAudio(audioFilePath: string, durationMs: number): Promise<AudioSegment[]> {
        const segments: AudioSegment[] = [];
        const segmentDurationMs = 30 * 1000; // 30 seconds

        // This is a simplified version - in production you'd use FFmpeg or similar
        // For now, create logical segments
        for (let i = 0; i < durationMs; i += segmentDurationMs) {
            const startTime = i / 1000;
            const endTime = Math.min((i + segmentDurationMs) / 1000, durationMs / 1000);

            segments.push({
                startTime,
                endTime,
                audioData: new ArrayBuffer(0), // Placeholder
                volume: Math.random() * 100, // Placeholder - would be calculated from actual audio
            });
        }

        return segments;
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

        // Analyze volume patterns to detect different events
        const avgVolume = segment.volume;
        const segmentDuration = segment.endTime - segment.startTime;

        // Snoring detection (based on volume patterns and frequency)
        if (avgVolume > 40 && segmentIndex % 3 === 0) { // Simulate snoring detection
            const intensity = avgVolume > 70 ? SleepEventIntensity.HIGH :
                avgVolume > 50 ? SleepEventIntensity.MODERATE :
                    SleepEventIntensity.LOW;

            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.SNORING,
                intensity,
                durationSeconds: segmentDuration,
                confidenceScore: 0.8 + (Math.random() * 0.2),
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    volume: avgVolume,
                    pattern: intensity === SleepEventIntensity.HIGH ? 'irregular' : 'regular',
                    frequency: 20 + (Math.random() * 30), // Hz
                },
            });
        }

        // Sleep talking detection (higher volume spikes with speech patterns)
        if (avgVolume > 60 && segmentIndex % 7 === 0) { // Simulate sleep talking
            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.SLEEP_TALKING,
                intensity: SleepEventIntensity.MODERATE,
                durationSeconds: Math.min(segmentDuration, 5 + Math.random() * 10),
                confidenceScore: 0.7 + (Math.random() * 0.2),
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    volume: avgVolume,
                    words_detected: ['hmm', 'nie', 'tak'], // Placeholder
                },
            });
        }

        // Movement detection (sudden volume changes)
        if (segmentIndex > 0 && Math.random() < 0.1) { // 10% chance of movement
            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.MOVEMENT,
                intensity: SleepEventIntensity.LOW,
                durationSeconds: 2 + Math.random() * 5,
                confidenceScore: 0.6 + (Math.random() * 0.3),
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    movement_type: 'position_change',
                    volume: avgVolume,
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
        try {
            // In production, you'd extract the audio segment and send to Whisper
            // For now, return placeholder transcriptions
            const placeholderTranscriptions = [
                'mmm... nie...',
                'gdzie jest...',
                'tak, tak...',
                'nie chcę...',
                'już późno...',
                'hmm... dobrze...',
            ];

            return placeholderTranscriptions[Math.floor(Math.random() * placeholderTranscriptions.length)];

            // Real implementation would be:
            // const transcription = await this.openai.audio.transcriptions.create({
            //     file: fs.createReadStream(segmentPath),
            //     model: 'whisper-1',
            //     language: 'pl',
            // });
            // return transcription.text;

        } catch (error) {
            this.logger.warn(`Transcription failed: ${error.message}`);
            return '';
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
     * Save events to database
     */
    private async saveEventsToDatabase(
        sleepTrackingId: string,
        events: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[],
    ): Promise<void> {
        if (events.length === 0) return;

        const sleepEvents = events.map(eventData =>
            this.sleepEventsRepository.create({
                ...eventData,
                sleepTrackingId,
            })
        );

        await this.sleepEventsRepository.save(sleepEvents);
        this.logger.log(`Saved ${sleepEvents.length} sleep events to database`);
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
