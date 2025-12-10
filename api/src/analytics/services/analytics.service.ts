import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyActivity } from '../../activities/entities/daily-activity.entity';
import { JournalEntry } from '../../journal/entities/journal-entry.entity';
import { SleepTracking } from '../../sleep/entities/sleep-tracking.entity';
import { VoiceNote } from '../../voice-notes/entities/voice-note.entity';
import { MetricSource, MetricType, PerformanceMetric } from '../entities/performance-metric.entity';

export interface AnalyticsData {
    userId: string;
    date: string;
    metrics: {
        energy: number | null;
        focus: number | null;
        productivity: number | null;
        mood: number | null;
        stress: number | null;
        motivation: number | null;
    };
    activities: number;
    sleepHours: number | null;
    sleepQuality: number | null;
    journalEntries: number;
    voiceNotes: number;
}

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectRepository(PerformanceMetric)
        private readonly performanceMetricRepository: Repository<PerformanceMetric>,
        @InjectRepository(DailyActivity)
        private readonly dailyActivityRepository: Repository<DailyActivity>,
        @InjectRepository(SleepTracking)
        private readonly sleepTrackingRepository: Repository<SleepTracking>,
        @InjectRepository(JournalEntry)
        private readonly journalEntryRepository: Repository<JournalEntry>,
        @InjectRepository(VoiceNote)
        private readonly voiceNoteRepository: Repository<VoiceNote>,
    ) { }

    async getDailyAnalytics(userId: string, date: string): Promise<AnalyticsData> {
        this.logger.debug(`Getting daily analytics for user ${userId} on ${date}`);

        const [metrics, activities, sleep, journalEntries, voiceNotes] = await Promise.all([
            this.getMetricsForDate(userId, date),
            this.getActivitiesForDate(userId, date),
            this.getSleepForDate(userId, date),
            this.getJournalEntriesForDate(userId, date),
            this.getVoiceNotesForDate(userId, date),
        ]);

        const metricsMap = metrics.reduce((acc, metric) => {
            acc[metric.metricType] = metric.value;
            return acc;
        }, {} as Record<MetricType, number>);

        return {
            userId,
            date,
            metrics: {
                energy: metricsMap[MetricType.ENERGY] || null,
                focus: metricsMap[MetricType.FOCUS] || null,
                productivity: metricsMap[MetricType.PRODUCTIVITY] || null,
                mood: metricsMap[MetricType.MOOD] || null,
                stress: metricsMap[MetricType.STRESS] || null,
                motivation: metricsMap[MetricType.MOTIVATION] || null,
            },
            activities: activities.length,
            sleepHours: sleep?.sleepDurationHours || null,
            sleepQuality: sleep?.sleepQualityScore || null,
            journalEntries: journalEntries.length,
            voiceNotes: voiceNotes.length,
        };
    }

    async getWeeklyAnalytics(userId: string, startDate: string, endDate: string): Promise<{
        summary: {
            avgEnergy: number | null;
            avgMood: number | null;
            avgProductivity: number | null;
            avgSleepHours: number | null;
            avgSleepQuality: number | null;
            totalActivities: number;
            totalJournalEntries: number;
            totalVoiceNotes: number;
        };
        trends: Array<{
            date: string;
            metrics: AnalyticsData['metrics'];
            activities: number;
            sleepHours: number | null;
        }>;
    }> {
        const dates = this.generateDateRange(startDate, endDate);
        const dailyData = await Promise.all(
            dates.map(date => this.getDailyAnalytics(userId, date))
        );

        // Calculate averages
        const validMetrics = dailyData.filter(d => Object.values(d.metrics).some(v => v !== null));
        const validSleep = dailyData.filter(d => d.sleepHours !== null);

        const summary = {
            avgEnergy: this.calculateAverage(validMetrics.map(d => d.metrics.energy)),
            avgMood: this.calculateAverage(validMetrics.map(d => d.metrics.mood)),
            avgProductivity: this.calculateAverage(validMetrics.map(d => d.metrics.productivity)),
            avgSleepHours: this.calculateAverage(validSleep.map(d => d.sleepHours!)),
            avgSleepQuality: this.calculateAverage(validSleep.map(d => d.sleepQuality!)),
            totalActivities: dailyData.reduce((sum, d) => sum + d.activities, 0),
            totalJournalEntries: dailyData.reduce((sum, d) => sum + d.journalEntries, 0),
            totalVoiceNotes: dailyData.reduce((sum, d) => sum + d.voiceNotes, 0),
        };

        const trends = dailyData.map(d => ({
            date: d.date,
            metrics: d.metrics,
            activities: d.activities,
            sleepHours: d.sleepHours,
        }));

        return { summary, trends };
    }

    async calculatePerformanceMetrics(userId: string, date: string): Promise<void> {
        this.logger.debug(`Calculating performance metrics for user ${userId} on ${date}`);

        // Get data for the date
        const [activities, sleep, journalEntries, voiceNotes] = await Promise.all([
            this.getActivitiesForDate(userId, date),
            this.getSleepForDate(userId, date),
            this.getJournalEntriesForDate(userId, date),
            this.getVoiceNotesForDate(userId, date),
        ]);

        // Calculate AI-inferred metrics based on activities and sleep
        const inferencesPromises = [
            this.inferEnergyFromSleep(userId, date, sleep),
            this.inferMoodFromJournal(userId, date, journalEntries, voiceNotes),
            this.inferProductivityFromActivities(userId, date, activities),
            this.inferStressFromAllSources(userId, date, activities, sleep, journalEntries, voiceNotes),
        ];

        await Promise.all(inferencesPromises);
        this.logger.debug(`Completed performance metrics calculation for user ${userId} on ${date}`);
    }

    private async inferEnergyFromSleep(userId: string, date: string, sleep: SleepTracking | null): Promise<void> {
        if (!sleep) return;

        let energyScore = 5; // Base score

        // Sleep duration impact (optimal 7-9 hours)
        if (sleep.sleepDurationHours >= 7 && sleep.sleepDurationHours <= 9) {
            energyScore += 2;
        } else if (sleep.sleepDurationHours < 6 || sleep.sleepDurationHours > 10) {
            energyScore -= 2;
        }

        // Sleep quality impact
        if (sleep.sleepQualityScore >= 8) {
            energyScore += 1.5;
        } else if (sleep.sleepQualityScore <= 5) {
            energyScore -= 1.5;
        }

        // Sleep efficiency impact
        const sleepEfficiency = sleep.sleepEfficiency || (sleep.analysisMetadata?.sleepEfficiency);
        if (sleepEfficiency && sleepEfficiency >= 90) {
            energyScore += 1;
        } else if (sleepEfficiency && sleepEfficiency < 80) {
            energyScore -= 1;
        }

        const confidence = Math.min(0.8, 0.6 + (sleep.sleepQualityScore / 10) * 0.2);
        energyScore = Math.max(1, Math.min(10, energyScore));

        await this.saveMetric(userId, date, MetricType.ENERGY, energyScore, MetricSource.AI_INFERRED, confidence, {
            sleepDuration: sleep.sleepDurationHours,
            sleepQuality: sleep.sleepQualityScore,
            sleepEfficiency: sleepEfficiency,
        });
    }

    private async inferMoodFromJournal(
        userId: string,
        date: string,
        journalEntries: JournalEntry[],
        voiceNotes: VoiceNote[]
    ): Promise<void> {
        if (journalEntries.length === 0 && voiceNotes.length === 0) return;

        // This would use sentiment analysis in a real implementation
        // For now, we'll use a simple heuristic based on entry length and keywords

        let moodScore = 5; // Neutral
        let confidence = 0.4; // Low confidence without real sentiment analysis

        // Analyze journal entries
        journalEntries.forEach(entry => {
            const positiveKeywords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'excited', 'grateful'];
            const negativeKeywords = ['sad', 'bad', 'terrible', 'awful', 'depressed', 'angry', 'frustrated'];

            const text = entry.content.toLowerCase();
            const positiveCount = positiveKeywords.filter(word => text.includes(word)).length;
            const negativeCount = negativeKeywords.filter(word => text.includes(word)).length;

            if (positiveCount > negativeCount) {
                moodScore += 1;
            } else if (negativeCount > positiveCount) {
                moodScore -= 1;
            }

            confidence += 0.1; // Each entry increases confidence slightly
        });

        moodScore = Math.max(1, Math.min(10, moodScore));
        confidence = Math.min(0.7, confidence);

        await this.saveMetric(userId, date, MetricType.MOOD, moodScore, MetricSource.AI_INFERRED, confidence, {
            journalEntries: journalEntries.length,
            voiceNotes: voiceNotes.length,
            analysisMethod: 'keyword_sentiment',
        });
    }

    private async inferProductivityFromActivities(
        userId: string,
        date: string,
        activities: DailyActivity[]
    ): Promise<void> {
        if (activities.length === 0) return;

        const workActivities = activities.filter(a =>
            a.activityType === 'work' ||
            a.tags.some(tag => tag.toLowerCase().includes('work'))
        );

        let productivityScore = 5;

        // Base score on number of completed work activities
        if (workActivities.length >= 5) {
            productivityScore = 8;
        } else if (workActivities.length >= 3) {
            productivityScore = 7;
        } else if (workActivities.length >= 1) {
            productivityScore = 6;
        } else {
            productivityScore = 4; // No work activities
        }

        // Adjust based on productivity rating
        const avgProductivity = activities.length > 0
            ? activities.reduce((sum, a) => sum + (a.productivityRating || 5), 0) / activities.length
            : 5;

        if (avgProductivity >= 8) {
            productivityScore += 1;
        } else if (avgProductivity < 5) {
            productivityScore -= 1;
        }

        const confidence = Math.min(0.7, 0.5 + (activities.length / 10) * 0.2);
        productivityScore = Math.max(1, Math.min(10, productivityScore));

        await this.saveMetric(userId, date, MetricType.PRODUCTIVITY, productivityScore, MetricSource.ACTIVITY_BASED, confidence, {
            totalActivities: activities.length,
            workActivities: workActivities.length,
            avgProductivity,
        });
    }

    private async inferStressFromAllSources(
        userId: string,
        date: string,
        activities: DailyActivity[],
        sleep: SleepTracking | null,
        journalEntries: JournalEntry[],
        voiceNotes: VoiceNote[]
    ): Promise<void> {
        let stressScore = 5; // Neutral
        let confidence = 0.3;

        // Sleep impact on stress
        if (sleep) {
            if (sleep.sleepDurationHours < 6) {
                stressScore += 2; // Poor sleep increases stress
            } else if (sleep.sleepDurationHours >= 8) {
                stressScore -= 1; // Good sleep reduces stress
            }

            if (sleep.sleepQualityScore < 6) {
                stressScore += 1;
            }
            confidence += 0.2;
        }

        // Activity load impact
        const highIntensityActivities = activities.filter(a =>
            a.tags.some(tag => ['urgent', 'deadline', 'important', 'high-priority'].includes(tag.toLowerCase()))
        );

        if (highIntensityActivities.length > 3) {
            stressScore += 2;
        } else if (activities.length > 10) {
            stressScore += 1; // High activity volume
        }

        confidence += Math.min(0.2, activities.length / 20);

        // Journal sentiment (simplified)
        journalEntries.forEach(entry => {
            const stressKeywords = ['stress', 'pressure', 'overwhelm', 'anxious', 'worried', 'deadline'];
            const relaxationKeywords = ['calm', 'peaceful', 'relaxed', 'meditation', 'rest'];

            const text = entry.content.toLowerCase();
            const stressCount = stressKeywords.filter(word => text.includes(word)).length;
            const relaxationCount = relaxationKeywords.filter(word => text.includes(word)).length;

            stressScore += (stressCount - relaxationCount) * 0.5;
            confidence += 0.1;
        });

        stressScore = Math.max(1, Math.min(10, stressScore));
        confidence = Math.min(0.8, confidence);

        await this.saveMetric(userId, date, MetricType.STRESS, stressScore, MetricSource.AI_INFERRED, confidence, {
            sleepHours: sleep?.sleepDurationHours,
            sleepQuality: sleep?.sleepQualityScore,
            highIntensityActivities: highIntensityActivities.length,
            totalActivities: activities.length,
            journalEntries: journalEntries.length,
        });
    }

    private async saveMetric(
        userId: string,
        date: string,
        metricType: MetricType,
        value: number,
        source: MetricSource,
        confidence: number,
        context: any
    ): Promise<void> {
        // Check if metric already exists
        const existing = await this.performanceMetricRepository.findOne({
            where: { userId, date, metricType, source },
        });

        if (existing) {
            // Update existing metric if new one has higher confidence
            if (confidence > existing.confidence) {
                existing.value = value;
                existing.confidence = confidence;
                existing.context = context;
                await this.performanceMetricRepository.save(existing);
            }
        } else {
            // Create new metric
            const metric = this.performanceMetricRepository.create({
                userId,
                date,
                metricType,
                value,
                source,
                confidence,
                context,
            });
            await this.performanceMetricRepository.save(metric);
        }
    }

    private async getMetricsForDate(userId: string, date: string): Promise<PerformanceMetric[]> {
        return this.performanceMetricRepository.find({
            where: { userId, date },
            order: { confidence: 'DESC' },
        });
    }

    private async getActivitiesForDate(userId: string, date: string): Promise<DailyActivity[]> {
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        return this.dailyActivityRepository.find({
            where: {
                userId,
                date: startOfDay.toISOString().split('T')[0],
            },
        });
    }

    private async getSleepForDate(userId: string, date: string): Promise<SleepTracking | null> {
        // Sleep tracking usually spans across dates, so we look for sleep that ended on this date
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        return this.sleepTrackingRepository.findOne({
            where: {
                userId,
                sleepDate: date,
            },
            order: { createdAt: 'DESC' },
        });
    }

    private async getJournalEntriesForDate(userId: string, date: string): Promise<JournalEntry[]> {
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        return this.journalEntryRepository.find({
            where: {
                userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                } as any,
            },
        });
    }

    private async getVoiceNotesForDate(userId: string, date: string): Promise<VoiceNote[]> {
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        return this.voiceNoteRepository.find({
            where: {
                userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                } as any,
            },
        });
    }

    private generateDateRange(startDate: string, endDate: string): string[] {
        const dates: string[] = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    private calculateAverage(values: (number | null)[]): number | null {
        const validValues = values.filter(v => v !== null) as number[];
        if (validValues.length === 0) return null;

        const sum = validValues.reduce((acc, val) => acc + val, 0);
        return Math.round((sum / validValues.length) * 10) / 10;
    }
}