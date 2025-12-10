import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInsight } from './entities/ai-insight.entity';
import { BehavioralPattern } from './entities/behavioral-pattern.entity';
import { LifeCorrelation } from './entities/life-correlation.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(LifeCorrelation)
        private readonly lifeCorrelationRepository: Repository<LifeCorrelation>,
        @InjectRepository(AIInsight)
        private readonly aiInsightRepository: Repository<AIInsight>,
        @InjectRepository(PerformanceMetric)
        private readonly performanceMetricRepository: Repository<PerformanceMetric>,
        @InjectRepository(BehavioralPattern)
        private readonly behavioralPatternRepository: Repository<BehavioralPattern>,
    ) { }

    // Life Correlations
    async discoverCorrelations(userId: string): Promise<LifeCorrelation[]> {
        // This would contain complex AI analysis to discover correlations
        // between sleep, activities, mood, etc.
        return await this.lifeCorrelationRepository.find({
            where: { userId },
            order: { confidence: 'DESC' },
        });
    }

    async createCorrelation(
        userId: string,
        correlationData: Partial<LifeCorrelation>,
    ): Promise<LifeCorrelation> {
        const correlation = this.lifeCorrelationRepository.create({
            ...correlationData,
            userId,
        });

        return await this.lifeCorrelationRepository.save(correlation);
    }

    // Personalized Insights
    async generateInsights(userId: string): Promise<AIInsight[]> {
        return await this.aiInsightRepository.find({
            where: { userId },
            order: { confidence: 'DESC' },
            take: 10,
        });
    }

    async createInsight(
        userId: string,
        insightData: Partial<AIInsight>,
    ): Promise<AIInsight> {
        const insight = this.aiInsightRepository.create({
            ...insightData,
            userId,
        });

        return await this.aiInsightRepository.save(insight);
    }

    // Performance Metrics
    async getPerformanceMetrics(userId: string): Promise<PerformanceMetric[]> {
        return await this.performanceMetricRepository.find({
            where: { userId },
            order: { date: 'DESC' },
            take: 30, // Last 30 days
        });
    }

    async recordPerformanceMetric(
        userId: string,
        metricData: Partial<PerformanceMetric>,
    ): Promise<PerformanceMetric> {
        const metric = this.performanceMetricRepository.create({
            ...metricData,
            userId,
        });

        return await this.performanceMetricRepository.save(metric);
    }

    // Behavioral Patterns
    async getBehavioralPatterns(userId: string): Promise<BehavioralPattern[]> {
        return await this.behavioralPatternRepository.find({
            where: { userId },
            order: { frequency: 'DESC' },
        });
    }

    async detectBehavioralPattern(
        userId: string,
        patternData: Partial<BehavioralPattern>,
    ): Promise<BehavioralPattern> {
        const pattern = this.behavioralPatternRepository.create({
            ...patternData,
            userId,
        });

        return await this.behavioralPatternRepository.save(pattern);
    }

    // Comprehensive Analytics Dashboard Data
    async getAnalyticsDashboard(userId: string): Promise<{
        correlations: LifeCorrelation[];
        insights: AIInsight[];
        performanceMetrics: PerformanceMetric[];
        behavioralPatterns: BehavioralPattern[];
    }> {
        const [correlations, insights, performanceMetrics, behavioralPatterns] = await Promise.all([
            this.discoverCorrelations(userId),
            this.generateInsights(userId),
            this.getPerformanceMetrics(userId),
            this.getBehavioralPatterns(userId),
        ]);

        return {
            correlations: correlations.slice(0, 5), // Top 5
            insights: insights.slice(0, 10), // Top 10
            performanceMetrics: performanceMetrics.slice(0, 7), // Last 7 days
            behavioralPatterns: behavioralPatterns.slice(0, 5), // Top 5 patterns
        };
    }
}