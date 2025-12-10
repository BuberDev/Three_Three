import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ActionabilityLevel,
    AIInsight,
    InsightCategory,
    InsightStatus,
    InsightType
} from '../entities/ai-insight.entity';
import { BehavioralPattern, PatternType } from '../entities/behavioral-pattern.entity';
import { LifeCorrelation } from '../entities/life-correlation.entity';
import { MetricType } from '../entities/performance-metric.entity';
import { AnalyticsService } from './analytics.service';
import { CorrelationService } from './correlation.service';
import { PatternService } from './pattern.service';

export interface InsightGenerationOptions {
    includeTypes?: InsightType[];
    categories?: InsightCategory[];
    minConfidence?: number;
    maxInsights?: number;
    timeRangeInDays?: number;
}

export interface InsightDashboard {
    summary: {
        total: number;
        new: number;
        highPriority: number;
        actionable: number;
    };
    trends: {
        mostCommonType: InsightType;
        mostCommonCategory: InsightCategory;
        averageConfidence: number;
        averageRelevance: number;
    };
    recommendations: {
        topActions: string[];
        quickWins: Array<{
            action: string;
            impact: number;
        }>;
    };
}

@Injectable()
export class InsightService {
    private readonly logger = new Logger(InsightService.name);

    constructor(
        @InjectRepository(AIInsight)
        private readonly aiInsightRepository: Repository<AIInsight>,
        private readonly analyticsService: AnalyticsService,
        private readonly correlationService: CorrelationService,
        private readonly patternService: PatternService,
    ) { }

    async generateInsights(userId: string, options: InsightGenerationOptions = {}): Promise<AIInsight[]> {
        this.logger.debug(`Generating insights for user ${userId}`);

        const {
            includeTypes = Object.values(InsightType),
            categories = Object.values(InsightCategory),
            minConfidence = 0.5,
            maxInsights = 50,
            timeRangeInDays = 30,
        } = options;

        const insights: AIInsight[] = [];

        // Generate different types of insights
        if (includeTypes.includes(InsightType.TREND)) {
            const trendInsights = await this.generateTrendInsights(userId, timeRangeInDays);
            insights.push(...trendInsights);
        }

        if (includeTypes.includes(InsightType.CORRELATION)) {
            const correlationInsights = await this.generateCorrelationInsights(userId);
            insights.push(...correlationInsights);
        }

        if (includeTypes.includes(InsightType.ANOMALY)) {
            const anomalyInsights = await this.generateAnomalyInsights(userId, timeRangeInDays);
            insights.push(...anomalyInsights);
        }

        if (includeTypes.includes(InsightType.PREDICTION)) {
            const predictionInsights = await this.generatePredictionInsights(userId);
            insights.push(...predictionInsights);
        }

        if (includeTypes.includes(InsightType.RECOMMENDATION)) {
            const recommendationInsights = await this.generateRecommendationInsights(userId);
            insights.push(...recommendationInsights);
        }

        if (includeTypes.includes(InsightType.WARNING)) {
            const warningInsights = await this.generateWarningInsights(userId);
            insights.push(...warningInsights);
        }

        if (includeTypes.includes(InsightType.OPPORTUNITY)) {
            const opportunityInsights = await this.generateOpportunityInsights(userId);
            insights.push(...opportunityInsights);
        }

        // Filter by categories and confidence
        const filteredInsights = insights
            .filter(insight => categories.includes(insight.category))
            .filter(insight => insight.confidence >= minConfidence)
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, maxInsights);

        // Save insights
        const savedInsights = await Promise.all(
            filteredInsights.map(insight => this.saveInsight(insight))
        );

        this.logger.debug(`Generated ${savedInsights.length} insights for user ${userId}`);
        return savedInsights;
    }

    private async generateTrendInsights(userId: string, timeRangeInDays: number): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - timeRangeInDays * 24 * 60 * 60 * 1000);

        // Get weekly analytics to analyze trends
        const weeklyData = await this.analyticsService.getWeeklyAnalytics(
            userId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        // Analyze each metric for trends
        Object.values(MetricType).forEach(metricType => {
            const metricValues = weeklyData.trends
                .map(d => d.metrics[metricType as keyof typeof d.metrics])
                .filter(v => v !== null) as number[];

            if (metricValues.length >= 7) { // Need at least a week of data
                const trend = this.calculateTrend(metricValues);

                if (Math.abs(trend.slope) > 0.1 && trend.confidence > 0.6) {
                    const direction = trend.slope > 0 ? 'improving' : 'declining';
                    const category = this.mapMetricToCategory(metricType);

                    const insight = this.createInsight(
                        userId,
                        InsightType.TREND,
                        category,
                        `Your ${metricType} is ${direction}`,
                        `Over the last ${timeRangeInDays} days, your ${metricType} has been ${direction} with a ${trend.strength} trend.`,
                        `This trend is based on analysis of ${metricValues.length} data points showing a consistent ${direction} pattern.`,
                        this.calculateActionabilityLevel(trend.strength, direction === 'improving'),
                        trend.confidence,
                        0.8, // High relevance for personal metrics
                        {
                            sources: [{
                                type: 'performance_metric',
                                timeRange: {
                                    start: startDate.toISOString(),
                                    end: endDate.toISOString(),
                                },
                                weight: 1,
                            }],
                            metrics: [{
                                name: metricType,
                                value: metricValues[metricValues.length - 1],
                                change: trend.change,
                                trend: direction === 'improving' ? 'up' : 'down',
                            }],
                        },
                        this.generateTrendRecommendations(metricType, direction, trend.strength)
                    );

                    insights.push(insight);
                }
            }
        });

        return insights;
    }

    private async generateCorrelationInsights(userId: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Get recent correlation discoveries
        const correlations = await this.correlationService.discoverCorrelations(userId, 90);

        // Convert top correlations to insights
        correlations.correlations
            .filter(c => c.isActionable)
            .slice(0, 5)
            .forEach(correlation => {
                const insight = this.createInsight(
                    userId,
                    InsightType.CORRELATION,
                    this.mapCorrelationToCategory(correlation),
                    correlation.title,
                    correlation.description,
                    `This correlation was discovered through analysis of ${correlation.sampleSize} data points with ${Math.round(correlation.confidence * 100)}% confidence.`,
                    ActionabilityLevel.HIGH,
                    correlation.confidence,
                    correlation.significance,
                    {
                        sources: [{
                            type: 'correlation_analysis',
                            weight: 1,
                        }],
                        correlations: [{
                            variable1: correlation.data.variables[0]?.name || 'unknown',
                            variable2: correlation.data.variables[1]?.name || 'unknown',
                            correlation: correlation.coefficient,
                            significance: correlation.significance,
                        }],
                    },
                    correlation.data.recommendations?.map((rec: string) => ({
                        action: rec,
                        difficulty: 'medium' as const,
                        expectedImpact: Math.abs(correlation.coefficient),
                        timeframe: '2-4 weeks',
                    })) || []
                );

                insights.push(insight);
            });

        return insights;
    }

    private async generateAnomalyInsights(userId: string, timeRangeInDays: number): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Get recent patterns to identify anomalies
        const patternData = await this.patternService.discoverPatterns(userId, timeRangeInDays);

        // Look for anomaly patterns
        const anomalies = patternData.patterns.filter(p => p.patternType === PatternType.ANOMALY);

        anomalies.forEach(anomaly => {
            const insight = this.createInsight(
                userId,
                InsightType.ANOMALY,
                this.mapPatternToCategory(anomaly),
                anomaly.title,
                anomaly.description,
                `This unusual pattern was detected with ${Math.round(anomaly.confidence * 100)}% confidence based on ${anomaly.occurrences} occurrences.`,
                anomaly.isBeneficial === false ? ActionabilityLevel.HIGH : ActionabilityLevel.MEDIUM,
                anomaly.confidence,
                0.7, // Anomalies are generally relevant for users to know
                {
                    sources: [{
                        type: 'pattern_analysis',
                        weight: 1,
                    }],
                    anomalies: [{
                        type: 'behavioral_anomaly',
                        severity: anomaly.confidence > 0.8 ? 'high' : 'medium',
                        details: anomaly.description,
                    }],
                },
                anomaly.recommendations.suggestions.map(s => ({
                    action: s.description,
                    difficulty: s.difficulty,
                    expectedImpact: s.expectedImpact,
                    timeframe: s.timeframe,
                }))
            );

            insights.push(insight);
        });

        return insights;
    }

    private async generatePredictionInsights(userId: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Get behavioral patterns to make predictions
        const patternData = await this.patternService.discoverPatterns(userId, 60);

        patternData.patterns
            .filter(p => p.nextPredicted && p.nextOccurrenceProbability > 0.6)
            .forEach(pattern => {
                const daysUntil = Math.ceil(
                    (new Date(pattern.nextPredicted!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                const insight = this.createInsight(
                    userId,
                    InsightType.PREDICTION,
                    this.mapPatternToCategory(pattern),
                    `Prediction: ${pattern.title}`,
                    `Based on your patterns, you're likely to ${pattern.description.toLowerCase()} ${daysUntil > 0 ? `in ${daysUntil} days` : 'soon'}.`,
                    `This prediction is based on your consistent ${pattern.title.toLowerCase()} pattern with ${Math.round(pattern.nextOccurrenceProbability * 100)}% probability.`,
                    pattern.isBeneficial === true ? ActionabilityLevel.MEDIUM : ActionabilityLevel.HIGH,
                    pattern.nextOccurrenceProbability,
                    0.6, // Predictions are moderately relevant
                    {
                        sources: [{
                            type: 'behavioral_pattern',
                            weight: 1,
                        }],
                        predictions: [{
                            outcome: pattern.title,
                            probability: pattern.nextOccurrenceProbability,
                            timeframe: daysUntil > 0 ? `${daysUntil} days` : 'soon',
                        }],
                    },
                    [{
                        action: pattern.isBeneficial === true ?
                            'Prepare to reinforce this positive pattern' :
                            'Prepare to interrupt this pattern',
                        difficulty: 'medium',
                        expectedImpact: 0.7,
                        timeframe: daysUntil > 0 ? `${daysUntil} days` : 'now',
                    }]
                );

                insights.push(insight);
            });

        return insights;
    }

    private async generateRecommendationInsights(userId: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Get all data to generate comprehensive recommendations
        const [correlationData, patternData] = await Promise.all([
            this.correlationService.discoverCorrelations(userId, 90),
            this.patternService.discoverPatterns(userId, 90),
        ]);

        // Generate recommendations from correlations
        correlationData.correlations
            .filter(c => c.isActionable)
            .slice(0, 3)
            .forEach(correlation => {
                correlation.data.recommendations?.forEach((rec: string) => {
                    const insight = this.createInsight(
                        userId,
                        InsightType.RECOMMENDATION,
                        this.mapCorrelationToCategory(correlation),
                        `Recommendation: ${rec}`,
                        `Based on the correlation between ${correlation.data.variables.map((v: any) => v.name).join(' and ')}, we recommend: ${rec}`,
                        `This recommendation is based on a ${correlation.strength} correlation with ${Math.round(correlation.confidence * 100)}% confidence.`,
                        ActionabilityLevel.HIGH,
                        correlation.confidence,
                        0.9, // Recommendations are highly relevant
                        {
                            sources: [{
                                type: 'correlation',
                                id: correlation.id,
                                weight: correlation.confidence,
                            }],
                        },
                        [{
                            action: rec,
                            difficulty: 'medium',
                            expectedImpact: Math.abs(correlation.coefficient),
                            timeframe: '1-2 weeks',
                        }]
                    );

                    insights.push(insight);
                });
            });

        // Generate recommendations from patterns
        patternData.patterns
            .filter(p => p.isActionable)
            .slice(0, 3)
            .forEach(pattern => {
                pattern.recommendations.suggestions.forEach(suggestion => {
                    const insight = this.createInsight(
                        userId,
                        InsightType.RECOMMENDATION,
                        this.mapPatternToCategory(pattern),
                        `Recommendation: ${suggestion.description}`,
                        suggestion.description,
                        `This recommendation is based on your ${pattern.title.toLowerCase()} pattern with ${Math.round(pattern.confidence * 100)}% confidence.`,
                        ActionabilityLevel.HIGH,
                        pattern.confidence,
                        0.9,
                        {
                            sources: [{
                                type: 'behavioral_pattern',
                                id: pattern.id,
                                weight: pattern.confidence,
                            }],
                        },
                        [{
                            action: suggestion.description,
                            difficulty: suggestion.difficulty,
                            expectedImpact: suggestion.expectedImpact,
                            timeframe: suggestion.timeframe,
                        }]
                    );

                    insights.push(insight);
                });
            });

        return insights;
    }

    private async generateWarningInsights(userId: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Get recent analytics to identify warning signs
        const recentAnalytics = await this.analyticsService.getDailyAnalytics(
            userId,
            new Date().toISOString().split('T')[0]
        );

        // Check for concerning patterns
        if (recentAnalytics.sleepHours !== null && recentAnalytics.sleepHours < 6) {
            const insight = this.createInsight(
                userId,
                InsightType.WARNING,
                InsightCategory.SLEEP,
                'Sleep deprivation warning',
                `You only got ${recentAnalytics.sleepHours} hours of sleep last night, which is below the recommended minimum.`,
                'Chronic sleep deprivation can significantly impact your health, mood, and cognitive performance.',
                ActionabilityLevel.HIGH,
                0.9,
                0.95, // Sleep warnings are very relevant
                {
                    sources: [{
                        type: 'sleep',
                        weight: 1,
                    }],
                    metrics: [{
                        name: 'sleep_hours',
                        value: recentAnalytics.sleepHours,
                        unit: 'hours',
                    }],
                },
                [{
                    action: 'Prioritize getting 7-9 hours of sleep tonight',
                    difficulty: 'medium',
                    expectedImpact: 0.8,
                    timeframe: 'tonight',
                }]
            );

            insights.push(insight);
        }

        // Check for low performance metrics
        Object.entries(recentAnalytics.metrics).forEach(([metricType, value]) => {
            if (value !== null && value <= 3) {
                const insight = this.createInsight(
                    userId,
                    InsightType.WARNING,
                    this.mapMetricToCategory(metricType as MetricType),
                    `Low ${metricType} warning`,
                    `Your ${metricType} is currently at ${value}/10, which is significantly below your typical range.`,
                    'Low performance metrics may indicate stress, fatigue, or other underlying issues that need attention.',
                    ActionabilityLevel.HIGH,
                    0.8,
                    0.9,
                    {
                        sources: [{
                            type: 'performance_metric',
                            weight: 1,
                        }],
                        metrics: [{
                            name: metricType,
                            value,
                        }],
                    },
                    [{
                        action: `Focus on activities that improve ${metricType}`,
                        difficulty: 'medium',
                        expectedImpact: 0.7,
                        timeframe: 'today',
                    }]
                );

                insights.push(insight);
            }
        });

        return insights;
    }

    private async generateOpportunityInsights(userId: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Get patterns to identify opportunities
        const patternData = await this.patternService.discoverPatterns(userId, 90);

        // Look for opportunities in positive patterns
        patternData.patterns
            .filter(p => p.isBeneficial === true && p.analytics.trendDirection === 'increasing')
            .forEach(pattern => {
                const insight = this.createInsight(
                    userId,
                    InsightType.OPPORTUNITY,
                    this.mapPatternToCategory(pattern),
                    `Opportunity: Strengthen ${pattern.title}`,
                    `You're developing a positive ${pattern.title.toLowerCase()} pattern. This is a great opportunity to reinforce it.`,
                    `This pattern shows ${pattern.strength} consistency and is trending positively.`,
                    ActionabilityLevel.MEDIUM,
                    pattern.confidence,
                    0.8,
                    {
                        sources: [{
                            type: 'behavioral_pattern',
                            id: pattern.id,
                            weight: pattern.confidence,
                        }],
                    },
                    pattern.recommendations.suggestions.filter(s => s.type === 'reinforce').map(s => ({
                        action: s.description,
                        difficulty: s.difficulty,
                        expectedImpact: s.expectedImpact,
                        timeframe: s.timeframe,
                    }))
                );

                insights.push(insight);
            });

        return insights;
    }

    private createInsight(
        userId: string,
        insightType: InsightType,
        category: InsightCategory,
        title: string,
        description: string,
        explanation: string,
        actionabilityLevel: ActionabilityLevel,
        confidence: number,
        relevanceScore: number,
        data: any,
        recommendations: Array<{
            action: string;
            difficulty: 'easy' | 'medium' | 'hard';
            expectedImpact: number;
            timeframe: string;
        }> = []
    ): AIInsight {
        // Set expiration based on insight type
        const expiresAt = new Date();
        switch (insightType) {
            case InsightType.WARNING:
                expiresAt.setDate(expiresAt.getDate() + 3);
                break;
            case InsightType.PREDICTION:
                expiresAt.setDate(expiresAt.getDate() + 14);
                break;
            case InsightType.OPPORTUNITY:
                expiresAt.setDate(expiresAt.getDate() + 7);
                break;
            default:
                expiresAt.setDate(expiresAt.getDate() + 30);
        }

        return {
            userId,
            insightType,
            category,
            title,
            description,
            explanation,
            actionabilityLevel,
            confidence,
            relevanceScore,
            expiresAt,
            data,
            recommendations,
            metadata: {
                algorithm: 'life_data_analyzer',
                version: '1.0',
                priority: this.calculatePriority(insightType, actionabilityLevel, confidence),
            },
        } as AIInsight;
    }

    private async saveInsight(insight: AIInsight): Promise<AIInsight> {
        // Check for existing similar insight
        const existing = await this.aiInsightRepository.findOne({
            where: {
                userId: insight.userId,
                title: insight.title,
                insightType: insight.insightType,
                category: insight.category,
            },
        });

        if (existing && existing.isValid) {
            // Update if new insight has better confidence
            if (insight.confidence > existing.confidence) {
                Object.assign(existing, insight);
                existing.generatedAt = new Date();
                return this.aiInsightRepository.save(existing);
            }
            return existing;
        }

        return this.aiInsightRepository.save(insight);
    }

    async getUserInsights(userId: string, limit: number = 20): Promise<AIInsight[]> {
        return this.aiInsightRepository.find({
            where: {
                userId,
                status: InsightStatus.NEW,
            },
            order: { generatedAt: 'DESC' },
            take: limit,
        });
    }

    async getInsightDashboard(userId: string): Promise<InsightDashboard> {
        const insights = await this.aiInsightRepository.find({
            where: { userId },
        });

        return AIInsight.generateDashboardInsights(insights);
    }

    async markInsightAsSeen(insightId: string): Promise<void> {
        const insight = await this.aiInsightRepository.findOne({
            where: { id: insightId },
        });

        if (insight) {
            insight.markAsSeen();
            await this.aiInsightRepository.save(insight);
        }
    }

    async addInsightFeedback(insightId: string, rating: number, feedback?: string): Promise<void> {
        const insight = await this.aiInsightRepository.findOne({
            where: { id: insightId },
        });

        if (insight) {
            insight.addUserFeedback(rating, feedback);
            await this.aiInsightRepository.save(insight);
        }
    }

    async dismissInsight(insightId: string, reason?: string): Promise<void> {
        const insight = await this.aiInsightRepository.findOne({
            where: { id: insightId },
        });

        if (insight) {
            insight.dismiss(reason);
            await this.aiInsightRepository.save(insight);
        }
    }

    // Helper methods
    private calculateTrend(values: number[]): {
        slope: number;
        change: number;
        strength: 'weak' | 'moderate' | 'strong';
        confidence: number;
    } {
        if (values.length < 3) {
            return { slope: 0, change: 0, strength: 'weak', confidence: 0 };
        }

        // Simple linear regression
        const n = values.length;
        const x = values.map((_, i) => i);
        const y = values;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const change = values[values.length - 1] - values[0];

        const absSlope = Math.abs(slope);
        let strength: 'weak' | 'moderate' | 'strong' = 'weak';
        if (absSlope > 0.3) strength = 'strong';
        else if (absSlope > 0.15) strength = 'moderate';

        const confidence = Math.min(0.9, 0.5 + absSlope * 0.8);

        return { slope, change, strength, confidence };
    }

    private calculateActionabilityLevel(strength: string, isPositive: boolean): ActionabilityLevel {
        if (strength === 'strong') {
            return isPositive ? ActionabilityLevel.MEDIUM : ActionabilityLevel.HIGH;
        }
        return ActionabilityLevel.MEDIUM;
    }

    private calculatePriority(
        type: InsightType,
        actionability: ActionabilityLevel,
        confidence: number
    ): 'low' | 'medium' | 'high' | 'critical' {
        if (type === InsightType.WARNING && actionability === ActionabilityLevel.HIGH) {
            return 'critical';
        }
        if ((type === InsightType.OPPORTUNITY || type === InsightType.RECOMMENDATION) &&
            actionability === ActionabilityLevel.HIGH && confidence > 0.8) {
            return 'high';
        }
        if (actionability === ActionabilityLevel.MEDIUM && confidence > 0.7) {
            return 'medium';
        }
        return 'low';
    }

    private mapMetricToCategory(metricType: MetricType): InsightCategory {
        switch (metricType) {
            case MetricType.ENERGY:
            case MetricType.STRESS:
                return InsightCategory.HEALTH;
            case MetricType.FOCUS:
            case MetricType.PRODUCTIVITY:
                return InsightCategory.PRODUCTIVITY;
            case MetricType.MOOD:
            case MetricType.MOTIVATION:
                return InsightCategory.WELLBEING;
            default:
                return InsightCategory.PERSONAL_GROWTH;
        }
    }

    private mapCorrelationToCategory(correlation: LifeCorrelation): InsightCategory {
        if (correlation.title.toLowerCase().includes('sleep')) {
            return InsightCategory.SLEEP;
        }
        if (correlation.title.toLowerCase().includes('exercise') ||
            correlation.title.toLowerCase().includes('activity')) {
            return InsightCategory.EXERCISE;
        }
        if (correlation.title.toLowerCase().includes('mood') ||
            correlation.title.toLowerCase().includes('stress')) {
            return InsightCategory.WELLBEING;
        }
        return InsightCategory.PERSONAL_GROWTH;
    }

    private mapPatternToCategory(pattern: BehavioralPattern): InsightCategory {
        if (pattern.title.toLowerCase().includes('sleep')) {
            return InsightCategory.SLEEP;
        }
        if (pattern.title.toLowerCase().includes('exercise') ||
            pattern.title.toLowerCase().includes('activity')) {
            return InsightCategory.EXERCISE;
        }
        if (pattern.title.toLowerCase().includes('habit')) {
            return InsightCategory.HABITS;
        }
        return InsightCategory.PERSONAL_GROWTH;
    }

    private generateTrendRecommendations(
        metricType: MetricType,
        direction: string,
        strength: string
    ): Array<{
        action: string;
        difficulty: 'easy' | 'medium' | 'hard';
        expectedImpact: number;
        timeframe: string;
    }> {
        const recommendations: Array<{
            action: string;
            difficulty: 'easy' | 'medium' | 'hard';
            expectedImpact: number;
            timeframe: string;
        }> = [];

        if (direction === 'declining') {
            switch (metricType) {
                case MetricType.ENERGY:
                    recommendations.push(
                        { action: 'Improve your sleep schedule', difficulty: 'medium', expectedImpact: 7, timeframe: '1-2 weeks' },
                        { action: 'Incorporate more physical activity', difficulty: 'easy', expectedImpact: 6, timeframe: '1 week' },
                        { action: 'Review nutrition and hydration habits', difficulty: 'easy', expectedImpact: 5, timeframe: '3-5 days' }
                    );
                    break;
                case MetricType.PRODUCTIVITY:
                    recommendations.push(
                        { action: 'Review task prioritization methods', difficulty: 'easy', expectedImpact: 6, timeframe: '1 week' },
                        { action: 'Implement time-blocking techniques', difficulty: 'medium', expectedImpact: 7, timeframe: '2 weeks' },
                        { action: 'Minimize distractions during work time', difficulty: 'easy', expectedImpact: 5, timeframe: '2-3 days' }
                    );
                    break;
                case MetricType.MOOD:
                    recommendations.push(
                        { action: 'Spend time on enjoyable activities', difficulty: 'easy', expectedImpact: 6, timeframe: 'Today' },
                        { action: 'Practice mindfulness or meditation', difficulty: 'medium', expectedImpact: 7, timeframe: '1 week' },
                        { action: 'Connect with friends and family', difficulty: 'easy', expectedImpact: 5, timeframe: '1-2 days' }
                    );
                    break;
                case MetricType.FOCUS:
                    recommendations.push(
                        { action: 'Try the Pomodoro technique', difficulty: 'easy', expectedImpact: 6, timeframe: '1 week' },
                        { action: 'Reduce multitasking', difficulty: 'medium', expectedImpact: 7, timeframe: '2 weeks' },
                        { action: 'Create a dedicated work environment', difficulty: 'medium', expectedImpact: 6, timeframe: '1 week' }
                    );
                    break;
                default:
                    recommendations.push(
                        { action: 'Monitor this trend and consider lifestyle adjustments', difficulty: 'easy', expectedImpact: 4, timeframe: 'Ongoing' }
                    );
            }
        } else if (direction === 'improving') {
            recommendations.push(
                { action: 'Continue your current positive habits', difficulty: 'easy', expectedImpact: 6, timeframe: 'Ongoing' },
                { action: 'Identify what\'s working well and maintain it', difficulty: 'easy', expectedImpact: 5, timeframe: '1 week' }
            );
        }

        return recommendations;
    }
}