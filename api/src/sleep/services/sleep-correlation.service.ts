import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenAI } from 'openai';
import { Between, Repository } from 'typeorm';
import { DailyActivity } from '../../activities/entities/daily-activity.entity';
import { VoiceNote } from '../../voice-notes/entities/voice-note.entity';
import { SleepEvent } from '../entities/sleep-event.entity';
import { SleepTracking } from '../entities/sleep-tracking.entity';

interface SleepCorrelation {
    type: 'diet' | 'mood' | 'activity' | 'stress' | 'environment';
    correlation: string;
    confidence: number;
    evidence: string[];
    recommendation: string;
}

interface SleepInsight {
    sleepTrackingId: string;
    date: string;
    correlations: SleepCorrelation[];
    overallInsight: string;
    actionableAdvice: string[];
    trendAnalysis?: string;
}

@Injectable()
export class SleepCorrelationService {
    private readonly logger = new Logger(SleepCorrelationService.name);
    private readonly openRouter: OpenAI | null = null;

    constructor(
        @InjectRepository(SleepTracking)
        private sleepTrackingRepository: Repository<SleepTracking>,
        @InjectRepository(SleepEvent)
        private sleepEventsRepository: Repository<SleepEvent>,
        @InjectRepository(VoiceNote)
        private voiceNotesRepository: Repository<VoiceNote>,
        @InjectRepository(DailyActivity)
        private dailyActivitiesRepository: Repository<DailyActivity>,
        private configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

        if (!apiKey) {
            this.logger.warn('OPENROUTER_API_KEY not configured. Sleep correlations will use fallback analysis.');
            return;
        }

        this.openRouter = new OpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });
    }

    /**
     * Main method: Generate comprehensive sleep insights with cross-data analysis
     */
    async generateSleepInsights(
        userId: string,
        sleepTrackingId: string,
    ): Promise<SleepInsight> {
        try {
            this.logger.log(`Generating sleep insights for user: ${userId}, tracking: ${sleepTrackingId}`);

            // 1. Get sleep record and events
            const sleepRecord = await this.sleepTrackingRepository.findOne({
                where: { id: sleepTrackingId, userId },
                relations: ['events'],
            });

            if (!sleepRecord) {
                throw new Error('Sleep record not found');
            }

            // 2. Get contextual data from same day and previous day
            const sleepDate = new Date(sleepRecord.sleepDate);
            const previousDay = new Date(sleepDate);
            previousDay.setDate(sleepDate.getDate() - 1);

            const [journalEntries, dailyActivities, recentSleepHistory] = await Promise.all([
                this.getJournalEntriesForPeriod(userId, previousDay, sleepDate),
                this.getDailyActivitiesForPeriod(userId, previousDay, sleepDate),
                this.getRecentSleepHistory(userId, sleepDate, 7), // Last 7 days
            ]);

            // 3. Prepare data for LLM analysis
            const contextData = this.prepareContextData(
                sleepRecord,
                journalEntries,
                dailyActivities,
                recentSleepHistory,
            );

            // 4. Generate LLM insights
            const correlations = await this.analyzeSleepCorrelations(contextData);

            // 5. Generate trend analysis if we have enough history
            const trendAnalysis = recentSleepHistory.length >= 3
                ? await this.analyzeSleepTrends(recentSleepHistory)
                : undefined;

            // 6. Create comprehensive insight
            const insight: SleepInsight = {
                sleepTrackingId,
                date: sleepRecord.sleepDate,
                correlations,
                overallInsight: await this.generateOverallInsight(contextData, correlations),
                actionableAdvice: this.generateActionableAdvice(correlations),
                trendAnalysis,
            };

            this.logger.log(`Generated ${correlations.length} correlations for sleep analysis`);
            return insight;

        } catch (error) {
            this.logger.error(`Sleep insight generation failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get journal entries for the period (voice notes with transcriptions)
     */
    private async getJournalEntriesForPeriod(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<VoiceNote[]> {
        const nextDay = new Date(endDate);
        nextDay.setDate(endDate.getDate() + 1);

        return this.voiceNotesRepository.find({
            where: {
                userId,
                createdAt: Between(startDate, nextDay),
                processingStatus: 'completed' as any, // Only processed notes with transcription
            },
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Get daily activities for the period
     */
    private async getDailyActivitiesForPeriod(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<DailyActivity[]> {
        return this.dailyActivitiesRepository.find({
            where: {
                userId,
                date: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
            },
            order: { date: 'ASC', createdAt: 'ASC' },
        });
    }

    /**
     * Get recent sleep history for trend analysis
     */
    private async getRecentSleepHistory(
        userId: string,
        currentDate: Date,
        days: number,
    ): Promise<SleepTracking[]> {
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - days);

        return this.sleepTrackingRepository.find({
            where: {
                userId,
                sleepDate: Between(startDate.toISOString().split('T')[0], currentDate.toISOString().split('T')[0]),
            },
            relations: ['events'],
            order: { sleepDate: 'DESC' },
        });
    }

    /**
     * Prepare structured data for LLM analysis
     */
    private prepareContextData(
        sleepRecord: SleepTracking,
        journalEntries: VoiceNote[],
        dailyActivities: DailyActivity[],
        recentSleepHistory: SleepTracking[],
    ) {
        return {
            currentSleep: {
                date: sleepRecord.sleepDate,
                duration: sleepRecord.sleepDurationHours,
                quality: sleepRecord.sleepQualityScore,
                snoring: {
                    detected: sleepRecord.snoringDetected,
                    intensity: sleepRecord.snoringIntensity,
                },
                sleepTalking: {
                    detected: sleepRecord.sleepTalkingDetected,
                    frequency: sleepRecord.sleepTalkingFrequency,
                },
                events: [], // Temporarily disabled - events relation not available
            },
            journalContext: journalEntries.map(note => ({
                date: note.createdAt,
                transcription: note.transcription,
                summary: note.summary,
                mood: note.extractedMetadata?.mood,
                topics: note.extractedMetadata?.topics,
            })),
            activities: dailyActivities.map(activity => ({
                type: activity.activityType,
                title: activity.title,
                description: activity.description,
                duration: activity.durationMinutes,
                moodBefore: activity.moodBefore,
                moodAfter: activity.moodAfter,
                tags: activity.tags,
            })),
            sleepHistory: recentSleepHistory.map(sleep => ({
                date: sleep.sleepDate,
                duration: sleep.sleepDurationHours,
                quality: sleep.sleepQualityScore,
                snoring: sleep.snoringDetected,
                sleepTalking: sleep.sleepTalkingDetected,
            })),
        };
    }

    /**
     * Use LLM to analyze sleep correlations with lifestyle data
     */
    private async analyzeSleepCorrelations(contextData: any): Promise<SleepCorrelation[]> {
        const prompt = `
Analyze the following sleep and lifestyle data to identify correlations. Be specific and evidence-based.

CURRENT SLEEP DATA:
${JSON.stringify(contextData.currentSleep, null, 2)}

JOURNAL ENTRIES (thoughts, feelings, events from previous day):
${JSON.stringify(contextData.journalContext, null, 2)}

DAILY ACTIVITIES (from previous day):
${JSON.stringify(contextData.activities, null, 2)}

RECENT SLEEP HISTORY (last 7 days):
${JSON.stringify(contextData.sleepHistory, null, 2)}

Identify specific correlations between:
1. Diet/eating patterns and sleep quality/snoring
2. Mood/stress levels and sleep disturbances 
3. Physical activities and sleep quality
4. Evening activities and sleep events
5. Environmental factors and sleep interruptions

For each correlation found, provide:
- Type: diet/mood/activity/stress/environment
- Correlation description (be specific)
- Confidence level (0-1)
- Evidence from the data
- Actionable recommendation

Return as JSON array of correlations. Be analytical and specific, not generic.
`;

        if (!this.openRouter) {
            return this.generateFallbackCorrelations(contextData);
        }

        try {
            const response = await this.openRouter.chat.completions.create({
                model: 'microsoft/phi-3-medium-128k-instruct:free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3, // Lower temperature for more analytical responses
                max_tokens: 2000,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return [];

            // Parse JSON response
            const correlations = JSON.parse(content);
            return Array.isArray(correlations) ? correlations : [];

        } catch (error) {
            this.logger.warn(`LLM correlation analysis failed: ${error.message}`);
            // Return fallback correlations based on simple rules
            return this.generateFallbackCorrelations(contextData);
        }
    }

    /**
     * Generate overall insight summary using LLM
     */
    private async generateOverallInsight(contextData: any, correlations: SleepCorrelation[]): Promise<string> {
        const prompt = `
Based on the sleep analysis and identified correlations, provide a comprehensive but concise insight summary.

SLEEP DATA: Quality ${contextData.currentSleep.quality}/10, Duration: ${contextData.currentSleep.duration}h
SNORING: ${contextData.currentSleep.snoring.detected ? contextData.currentSleep.snoring.intensity : 'none'}
SLEEP TALKING: ${contextData.currentSleep.sleepTalking.frequency || 0} times

IDENTIFIED CORRELATIONS:
${correlations.map(c => `- ${c.type}: ${c.correlation}`).join('\n')}

Write a personalized 2-3 sentence insight that:
1. Summarizes the sleep quality and main issues
2. Highlights the most significant correlation found
3. Provides encouragement and next steps

Write in Polish, be empathetic but analytical.
`;

        if (!this.openRouter) {
            return this.generateFallbackInsight(contextData);
        }

        try {
            const response = await this.openRouter.chat.completions.create({
                model: 'microsoft/phi-3-medium-128k-instruct:free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 300,
            });

            return response.choices[0]?.message?.content || this.generateFallbackInsight(contextData);

        } catch (error) {
            this.logger.warn(`LLM insight generation failed: ${error.message}`);
            return this.generateFallbackInsight(contextData);
        }
    }

    /**
     * Analyze sleep trends over time
     */
    private async analyzeSleepTrends(sleepHistory: SleepTracking[]): Promise<string> {
        const avgQuality = sleepHistory.reduce((sum, s) => sum + (s.sleepQualityScore || 0), 0) / sleepHistory.length;
        const avgDuration = sleepHistory.reduce((sum, s) => sum + (s.sleepDurationHours || 0), 0) / sleepHistory.length;

        const snoringTrend = sleepHistory.filter(s => s.snoringDetected).length / sleepHistory.length;

        let trend = `W ostatnich ${sleepHistory.length} dniach: `;

        if (avgQuality >= 7) {
            trend += `dobra jakość snu (średnio ${avgQuality.toFixed(1)}/10). `;
        } else if (avgQuality >= 5) {
            trend += `przeciętna jakość snu (średnio ${avgQuality.toFixed(1)}/10). `;
        } else {
            trend += `niska jakość snu (średnio ${avgQuality.toFixed(1)}/10). `;
        }

        if (snoringTrend > 0.5) {
            trend += `Chrapanie występuje często (${Math.round(snoringTrend * 100)}% nocy).`;
        } else if (snoringTrend > 0) {
            trend += `Chrapanie występuje sporadycznie.`;
        }

        return trend;
    }

    /**
     * Generate actionable advice from correlations
     */
    private generateActionableAdvice(correlations: SleepCorrelation[]): string[] {
        const advice: string[] = [];

        correlations.forEach(correlation => {
            if (correlation.confidence > 0.6) {
                advice.push(correlation.recommendation);
            }
        });

        // Add general advice if no specific correlations found
        if (advice.length === 0) {
            advice.push(
                'Spróbuj regularnych godzin snu',
                'Unikaj ekranów 1h przed snem',
                'Stwórz ciemne i ciche środowisko do snu'
            );
        }

        return advice.slice(0, 5); // Maximum 5 pieces of advice
    }

    /**
     * Fallback correlations when LLM fails
     */
    private generateFallbackCorrelations(contextData: any): SleepCorrelation[] {
        const correlations: SleepCorrelation[] = [];

        // Simple rule-based correlations
        if (contextData.currentSleep.snoring.detected) {
            correlations.push({
                type: 'diet',
                correlation: 'Chrapanie może być związane z późnym jedzeniem',
                confidence: 0.6,
                evidence: ['Wykryto chrapanie w nagraniu'],
                recommendation: 'Unikaj jedzenia 3 godziny przed snem',
            });
        }

        if (contextData.currentSleep.quality < 6) {
            correlations.push({
                type: 'stress',
                correlation: 'Niska jakość snu może wskazywać na stres',
                confidence: 0.5,
                evidence: [`Jakość snu: ${contextData.currentSleep.quality}/10`],
                recommendation: 'Spróbuj technik relaksacyjnych przed snem',
            });
        }

        return correlations;
    }

    /**
     * Fallback insight when LLM fails
     */
    private generateFallbackInsight(contextData: any): string {
        const quality = contextData.currentSleep.quality;
        const duration = contextData.currentSleep.duration;

        if (quality >= 7) {
            return `Dobrej jakości sen (${quality}/10) przez ${duration}h. Kontynuuj obecne nawyki senne.`;
        } else if (quality >= 5) {
            return `Sen o przeciętnej jakości (${quality}/10). Warto przeanalizować czynniki wpływające na odpoczynek.`;
        } else {
            return `Niska jakość snu (${quality}/10) może wpływać na Twoje samopoczucie. Rozważ zmiany w rutynie wieczornej.`;
        }
    }
}
