import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DailyActivity } from '../../activities/entities/daily-activity.entity';
import { JournalEntry } from '../../journal/entities/journal-entry.entity';
import { SleepTracking } from '../../sleep/entities/sleep-tracking.entity';
import { CorrelationStrength, CorrelationType, LifeCorrelation } from '../entities/life-correlation.entity';
import { MetricType, PerformanceMetric } from '../entities/performance-metric.entity';

export interface CorrelationDiscoveryResult {
    correlations: LifeCorrelation[];
    conflicts: Array<{
        correlation1: LifeCorrelation;
        correlation2: LifeCorrelation;
        conflictReason: string;
    }>;
    insights: Array<{
        type: string;
        message: string;
        confidence: number;
        data: any;
    }>;
}

@Injectable()
export class CorrelationService {
    private readonly logger = new Logger(CorrelationService.name);

    constructor(
        @InjectRepository(LifeCorrelation)
        private readonly lifeCorrelationRepository: Repository<LifeCorrelation>,
        @InjectRepository(PerformanceMetric)
        private readonly performanceMetricRepository: Repository<PerformanceMetric>,
        @InjectRepository(DailyActivity)
        private readonly dailyActivityRepository: Repository<DailyActivity>,
        @InjectRepository(SleepTracking)
        private readonly sleepTrackingRepository: Repository<SleepTracking>,
        @InjectRepository(JournalEntry)
        private readonly journalEntryRepository: Repository<JournalEntry>,
    ) { }

    async discoverCorrelations(userId: string, timeRangeInDays: number = 90): Promise<CorrelationDiscoveryResult> {
        this.logger.debug(`Discovering correlations for user ${userId} over ${timeRangeInDays} days`);

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - timeRangeInDays * 24 * 60 * 60 * 1000);

        // Gather all data for the time period
        const [metrics, activities, sleepData, journalEntries] = await Promise.all([
            this.getMetricsInRange(userId, startDate, endDate),
            this.getActivitiesInRange(userId, startDate, endDate),
            this.getSleepDataInRange(userId, startDate, endDate),
            this.getJournalEntriesInRange(userId, startDate, endDate),
        ]);

        const correlations: LifeCorrelation[] = [];

        // Discover performance metric correlations
        const metricCorrelations = await this.discoverMetricCorrelations(userId, metrics);
        correlations.push(...metricCorrelations);

        // Discover sleep-performance correlations
        const sleepCorrelations = await this.discoverSleepPerformanceCorrelations(userId, metrics, sleepData);
        correlations.push(...sleepCorrelations);

        // Discover activity-performance correlations
        const activityCorrelations = await this.discoverActivityPerformanceCorrelations(userId, metrics, activities);
        correlations.push(...activityCorrelations);

        // Discover temporal patterns
        const temporalCorrelations = await this.discoverTemporalPatterns(userId, metrics, activities, sleepData);
        correlations.push(...temporalCorrelations);

        // Save new correlations
        const savedCorrelations = await Promise.all(
            correlations.map(correlation => this.saveCorrelation(correlation))
        );

        // Find conflicts
        const allUserCorrelations = await this.getUserCorrelations(userId);
        const conflicts = LifeCorrelation.findConflictingCorrelations(allUserCorrelations);

        // Generate insights
        const insights = this.generateCorrelationInsights(savedCorrelations);

        return {
            correlations: savedCorrelations,
            conflicts,
            insights,
        };
    }

    private async discoverMetricCorrelations(
        userId: string,
        metrics: PerformanceMetric[]
    ): Promise<LifeCorrelation[]> {
        const correlations: LifeCorrelation[] = [];
        const metricTypes = Object.values(MetricType);

        for (let i = 0; i < metricTypes.length; i++) {
            for (let j = i + 1; j < metricTypes.length; j++) {
                const type1 = metricTypes[i];
                const type2 = metricTypes[j];

                const correlation = PerformanceMetric.findCorrelations(metrics, type1, type2);
                if (correlation && correlation.strength !== 'weak' && correlation.sampleSize >= 10) {
                    const lifeCorrelation = this.createCorrelationEntity(
                        userId,
                        CorrelationType.ACTIVITY_PERFORMANCE,
                        `${type1} and ${type2} correlation`,
                        `${type1} shows ${correlation.strength} ${correlation.correlation > 0 ? 'positive' : 'negative'} correlation with ${type2}`,
                        correlation.correlation,
                        correlation.strength as any,
                        correlation.significance,
                        correlation.significance,
                        correlation.sampleSize,
                        {
                            variables: [
                                { name: type1, type: 'performance_metric' },
                                { name: type2, type: 'performance_metric' },
                            ],
                            timeRange: {
                                start: metrics[0]?.date || '',
                                end: metrics[metrics.length - 1]?.date || '',
                                duration: `${correlation.sampleSize} days`,
                            },
                            patterns: [{
                                pattern: `When ${type1} ${correlation.correlation > 0 ? 'increases' : 'decreases'}, ${type2} tends to ${correlation.correlation > 0 ? 'increase' : 'decrease'}`,
                                frequency: correlation.sampleSize,
                                examples: [],
                            }],
                            recommendations: this.generateMetricCorrelationRecommendations(type1, type2, correlation.correlation),
                        }
                    );
                    correlations.push(lifeCorrelation);
                }
            }
        }

        return correlations;
    }

    private async discoverSleepPerformanceCorrelations(
        userId: string,
        metrics: PerformanceMetric[],
        sleepData: SleepTracking[]
    ): Promise<LifeCorrelation[]> {
        const correlations: LifeCorrelation[] = [];

        if (sleepData.length < 10) return correlations;

        // Group metrics by date for correlation analysis
        const metricsByDate = this.groupMetricsByDate(metrics);
        const sleepByDate = this.groupSleepByDate(sleepData);

        // Find correlations between sleep metrics and performance metrics
        const sleepMetrics = ['duration', 'qualityScore', 'efficiency', 'deepSleepMinutes'];
        const performanceMetrics = Object.values(MetricType);

        for (const sleepMetric of sleepMetrics) {
            for (const perfMetric of performanceMetrics) {
                const correlation = this.calculateSleepPerformanceCorrelation(
                    sleepByDate,
                    metricsByDate,
                    sleepMetric,
                    perfMetric
                );

                if (correlation && Math.abs(correlation.coefficient) > 0.3 && correlation.sampleSize >= 10) {
                    const strength = LifeCorrelation.calculateStrength(correlation.coefficient);
                    const lifeCorrelation = this.createCorrelationEntity(
                        userId,
                        CorrelationType.SLEEP_PERFORMANCE,
                        `Sleep ${sleepMetric} affects ${perfMetric}`,
                        `${sleepMetric} shows ${strength} ${correlation.coefficient > 0 ? 'positive' : 'negative'} correlation with ${perfMetric}`,
                        correlation.coefficient,
                        strength,
                        correlation.confidence,
                        correlation.significance,
                        correlation.sampleSize,
                        {
                            variables: [
                                { name: sleepMetric, type: 'sleep_metric' },
                                { name: perfMetric, type: 'performance_metric' },
                            ],
                            timeRange: {
                                start: sleepData[0]?.sleepDate || '',
                                end: sleepData[sleepData.length - 1]?.sleepDate || '',
                                duration: `${correlation.sampleSize} days`,
                            },
                            patterns: [{
                                pattern: this.describeSleepPattern(sleepMetric, perfMetric, correlation.coefficient),
                                frequency: correlation.sampleSize,
                                examples: [],
                            }],
                            recommendations: this.generateSleepRecommendations(sleepMetric, perfMetric, correlation.coefficient),
                        }
                    );
                    correlations.push(lifeCorrelation);
                }
            }
        }

        return correlations;
    }

    private async discoverActivityPerformanceCorrelations(
        userId: string,
        metrics: PerformanceMetric[],
        activities: DailyActivity[]
    ): Promise<LifeCorrelation[]> {
        const correlations: LifeCorrelation[] = [];

        if (activities.length < 20) return correlations;

        // Group by date
        const metricsByDate = this.groupMetricsByDate(metrics);
        const activitiesByDate = this.groupActivitiesByDate(activities);

        // Analyze activity categories vs performance
        const categories = [...new Set(activities.map(a => a.activityType))];
        const performanceMetrics = Object.values(MetricType);

        for (const category of categories) {
            for (const perfMetric of performanceMetrics) {
                const correlation = this.calculateActivityPerformanceCorrelation(
                    activitiesByDate,
                    metricsByDate,
                    category,
                    perfMetric
                );

                if (correlation && Math.abs(correlation.coefficient) > 0.25 && correlation.sampleSize >= 15) {
                    const strength = LifeCorrelation.calculateStrength(correlation.coefficient);
                    const lifeCorrelation = this.createCorrelationEntity(
                        userId,
                        CorrelationType.ACTIVITY_PERFORMANCE,
                        `${category} activities impact ${perfMetric}`,
                        `${category} activities show ${strength} ${correlation.coefficient > 0 ? 'positive' : 'negative'} correlation with ${perfMetric}`,
                        correlation.coefficient,
                        strength,
                        correlation.confidence,
                        correlation.significance,
                        correlation.sampleSize,
                        {
                            variables: [
                                { name: category, type: 'activity_category' },
                                { name: perfMetric, type: 'performance_metric' },
                            ],
                            timeRange: {
                                start: activities[0]?.date || '',
                                end: activities[activities.length - 1]?.date || '',
                                duration: `${correlation.sampleSize} days`,
                            },
                            patterns: [{
                                pattern: this.describeActivityPattern(category, perfMetric, correlation.coefficient),
                                frequency: correlation.sampleSize,
                                examples: [],
                            }],
                            recommendations: this.generateActivityRecommendations(category, perfMetric, correlation.coefficient),
                        }
                    );
                    correlations.push(lifeCorrelation);
                }
            }
        }

        return correlations;
    }

    private async discoverTemporalPatterns(
        userId: string,
        metrics: PerformanceMetric[],
        activities: DailyActivity[],
        sleepData: SleepTracking[]
    ): Promise<LifeCorrelation[]> {
        const correlations: LifeCorrelation[] = [];

        // Day of week patterns
        const dayOfWeekCorrelations = this.analyzeDayOfWeekPatterns(userId, metrics);
        correlations.push(...dayOfWeekCorrelations);

        // Time of day patterns for activities
        const timeOfDayCorrelations = this.analyzeTimeOfDayPatterns(userId, activities, metrics);
        correlations.push(...timeOfDayCorrelations);

        return correlations;
    }

    private createCorrelationEntity(
        userId: string,
        correlationType: CorrelationType,
        title: string,
        description: string,
        coefficient: number,
        strength: CorrelationStrength,
        confidence: number,
        significance: number,
        sampleSize: number,
        data: any
    ): LifeCorrelation {
        return {
            userId,
            correlationType,
            title,
            description,
            coefficient,
            strength,
            confidence,
            significance,
            sampleSize,
            discoveryDate: new Date(),
            lastUpdated: new Date(),
            isValidated: false,
            data,
            metadata: {
                algorithm: 'pearson_correlation',
                version: '1.0',
                dataQuality: Math.min(confidence + 0.2, 1),
            },
        } as LifeCorrelation;
    }

    private async saveCorrelation(correlation: LifeCorrelation): Promise<LifeCorrelation> {
        // Check for existing similar correlation
        const existing = await this.lifeCorrelationRepository.findOne({
            where: {
                userId: correlation.userId,
                title: correlation.title,
                correlationType: correlation.correlationType,
            },
        });

        if (existing) {
            // Update if new correlation has better confidence
            if (correlation.confidence > existing.confidence) {
                Object.assign(existing, correlation);
                existing.lastUpdated = new Date();
                return this.lifeCorrelationRepository.save(existing);
            }
            return existing;
        }

        return this.lifeCorrelationRepository.save(correlation);
    }

    private async getUserCorrelations(userId: string): Promise<LifeCorrelation[]> {
        return this.lifeCorrelationRepository.find({
            where: { userId },
            order: { confidence: 'DESC' },
        });
    }

    private generateCorrelationInsights(correlations: LifeCorrelation[]): Array<{
        type: string;
        message: string;
        confidence: number;
        data: any;
    }> {
        const insights: Array<{
            type: string;
            message: string;
            confidence: number;
            data: any;
        }> = [];

        // Most significant correlations
        const strongCorrelations = correlations
            .filter(c => c.strength === CorrelationStrength.STRONG || c.strength === CorrelationStrength.VERY_STRONG)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);

        strongCorrelations.forEach(correlation => {
            insights.push({
                type: 'strong_correlation',
                message: `Strong relationship discovered: ${correlation.title}`,
                confidence: correlation.confidence,
                data: correlation,
            });
        });

        // Sleep-related insights
        const sleepCorrelations = correlations.filter(c => c.correlationType === CorrelationType.SLEEP_PERFORMANCE);
        if (sleepCorrelations.length > 0) {
            const avgSleepImpact = sleepCorrelations.reduce((sum, c) => sum + Math.abs(c.coefficient), 0) / sleepCorrelations.length;
            insights.push({
                type: 'sleep_impact',
                message: `Sleep quality significantly affects ${sleepCorrelations.length} performance areas`,
                confidence: avgSleepImpact,
                data: { correlations: sleepCorrelations.length, avgImpact: avgSleepImpact },
            });
        }

        return insights;
    }

    // Helper methods for calculations
    private groupMetricsByDate(metrics: PerformanceMetric[]): Record<string, Record<MetricType, number>> {
        return metrics.reduce((acc, metric) => {
            if (!acc[metric.date]) acc[metric.date] = {} as Record<MetricType, number>;
            if (metric.isReliable) {
                acc[metric.date][metric.metricType] = metric.value;
            }
            return acc;
        }, {} as Record<string, Record<MetricType, number>>);
    }

    private groupSleepByDate(sleepData: SleepTracking[]): Record<string, SleepTracking> {
        return sleepData.reduce((acc, sleep) => {
            const date = sleep.sleepDate;
            if (date) {
                acc[date] = sleep;
            }
            return acc;
        }, {} as Record<string, SleepTracking>);
    }

    private groupActivitiesByDate(activities: DailyActivity[]): Record<string, DailyActivity[]> {
        return activities.reduce((acc, activity) => {
            const date = activity.date;
            if (date) {
                if (!acc[date]) acc[date] = [];
                acc[date].push(activity);
            }
            return acc;
        }, {} as Record<string, DailyActivity[]>);
    }

    private calculateSleepPerformanceCorrelation(
        sleepByDate: Record<string, SleepTracking>,
        metricsByDate: Record<string, Record<MetricType, number>>,
        sleepMetric: string,
        perfMetric: MetricType
    ): { coefficient: number; confidence: number; significance: number; sampleSize: number } | null {
        const pairs: Array<[number, number]> = [];

        Object.keys(sleepByDate).forEach(date => {
            const sleep = sleepByDate[date];
            const metrics = metricsByDate[date];

            if (sleep && metrics && metrics[perfMetric] !== undefined) {
                const sleepValue = (sleep as any)[sleepMetric];
                if (sleepValue !== undefined) {
                    pairs.push([sleepValue, metrics[perfMetric]]);
                }
            }
        });

        if (pairs.length < 5) return null;

        return this.calculatePearsonCorrelation(pairs);
    }

    private calculateActivityPerformanceCorrelation(
        activitiesByDate: Record<string, DailyActivity[]>,
        metricsByDate: Record<string, Record<MetricType, number>>,
        category: string,
        perfMetric: MetricType
    ): { coefficient: number; confidence: number; significance: number; sampleSize: number } | null {
        const pairs: Array<[number, number]> = [];

        Object.keys(activitiesByDate).forEach(date => {
            const activities = activitiesByDate[date];
            const metrics = metricsByDate[date];

            if (activities && metrics && metrics[perfMetric] !== undefined) {
                const categoryActivityCount = activities.filter(a => a.activityType === category).length;
                pairs.push([categoryActivityCount, metrics[perfMetric]]);
            }
        });

        if (pairs.length < 10) return null;

        return this.calculatePearsonCorrelation(pairs);
    }

    private calculatePearsonCorrelation(pairs: Array<[number, number]>): {
        coefficient: number;
        confidence: number;
        significance: number;
        sampleSize: number;
    } {
        const n = pairs.length;
        const sumX = pairs.reduce((acc, [x]) => acc + x, 0);
        const sumY = pairs.reduce((acc, [, y]) => acc + y, 0);
        const sumXY = pairs.reduce((acc, [x, y]) => acc + x * y, 0);
        const sumXX = pairs.reduce((acc, [x]) => acc + x * x, 0);
        const sumYY = pairs.reduce((acc, [, y]) => acc + y * y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        if (denominator === 0) {
            return { coefficient: 0, confidence: 0, significance: 0, sampleSize: n };
        }

        const coefficient = numerator / denominator;
        const absCorr = Math.abs(coefficient);

        // Simple confidence calculation based on sample size and correlation strength
        const confidence = Math.min(0.9, 0.4 + (absCorr * 0.4) + ((n - 5) / 50) * 0.2);

        // Simple significance approximation
        const significance = Math.min(absCorr * Math.sqrt(n - 2) / Math.sqrt(1 - absCorr * absCorr), 1);

        return {
            coefficient: Math.round(coefficient * 1000) / 1000,
            confidence: Math.round(confidence * 100) / 100,
            significance: Math.round(significance * 100) / 100,
            sampleSize: n,
        };
    }

    // Helper methods for generating recommendations and descriptions
    private generateMetricCorrelationRecommendations(type1: MetricType, type2: MetricType, correlation: number): string[] {
        if (correlation > 0) {
            return [
                `Focus on improving ${type1} as it positively affects ${type2}`,
                `Track both metrics together for better optimization`,
            ];
        } else {
            return [
                `Monitor ${type1} levels as high values may negatively impact ${type2}`,
                `Consider balancing activities that affect these metrics`,
            ];
        }
    }

    private generateSleepRecommendations(sleepMetric: string, perfMetric: MetricType, correlation: number): string[] {
        if (correlation > 0) {
            return [
                `Prioritize ${sleepMetric} to improve ${perfMetric}`,
                `Maintain consistent sleep schedule for better performance`,
            ];
        } else {
            return [
                `Investigate why ${sleepMetric} negatively correlates with ${perfMetric}`,
                `Consider sleep quality over quantity`,
            ];
        }
    }

    private generateActivityRecommendations(category: string, perfMetric: MetricType, correlation: number): string[] {
        if (correlation > 0) {
            return [
                `Increase ${category} activities to boost ${perfMetric}`,
                `Schedule more ${category} activities during low-performance periods`,
            ];
        } else {
            return [
                `Consider reducing ${category} activities when ${perfMetric} is important`,
                `Balance ${category} activities with recovery time`,
            ];
        }
    }

    private describeSleepPattern(sleepMetric: string, perfMetric: MetricType, correlation: number): string {
        const direction = correlation > 0 ? 'better' : 'worse';
        return `Better ${sleepMetric} leads to ${direction} ${perfMetric}`;
    }

    private describeActivityPattern(category: string, perfMetric: MetricType, correlation: number): string {
        const effect = correlation > 0 ? 'improves' : 'decreases';
        return `${category} activities ${effect} ${perfMetric}`;
    }

    private analyzeDayOfWeekPatterns(userId: string, metrics: PerformanceMetric[]): LifeCorrelation[] {
        // Implementation for day-of-week pattern analysis
        // This would analyze if certain days of the week consistently show different performance patterns
        return [];
    }

    private analyzeTimeOfDayPatterns(userId: string, activities: DailyActivity[], metrics: PerformanceMetric[]): LifeCorrelation[] {
        // Implementation for time-of-day pattern analysis
        // This would analyze if activities at certain times of day correlate with performance
        return [];
    }

    // Data fetching methods
    private async getMetricsInRange(userId: string, startDate: Date, endDate: Date): Promise<PerformanceMetric[]> {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];

        return this.performanceMetricRepository.find({
            where: {
                userId,
                date: Between(start, end),
            },
            order: { date: 'ASC' },
        });
    }

    private async getActivitiesInRange(userId: string, startDate: Date, endDate: Date): Promise<DailyActivity[]> {
        return this.dailyActivityRepository.find({
            where: {
                userId,
                date: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
            },
            order: { date: 'ASC' },
        });
    }

    private async getSleepDataInRange(userId: string, startDate: Date, endDate: Date): Promise<SleepTracking[]> {
        return this.sleepTrackingRepository.find({
            where: {
                userId,
                sleepDate: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
            },
            order: { sleepDate: 'ASC' },
        });
    }

    private async getJournalEntriesInRange(userId: string, startDate: Date, endDate: Date): Promise<JournalEntry[]> {
        return this.journalEntryRepository.find({
            where: {
                userId,
                createdAt: Between(startDate, endDate),
            },
            order: { createdAt: 'ASC' },
        });
    }
}