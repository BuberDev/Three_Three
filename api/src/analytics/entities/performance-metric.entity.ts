import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum MetricType {
    ENERGY = 'energy',
    FOCUS = 'focus',
    PRODUCTIVITY = 'productivity',
    MOOD = 'mood',
    STRESS = 'stress',
    MOTIVATION = 'motivation',
}

export enum MetricSource {
    SELF_REPORTED = 'self_reported',
    AI_INFERRED = 'ai_inferred',
    ACTIVITY_BASED = 'activity_based',
}

@Entity('performance_metrics')
@Index(['userId', 'date'])
@Index(['metricType'])
@Index(['userId', 'date', 'metricType', 'source'], { unique: true })
export class PerformanceMetric extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ type: 'date' })
    date: string;

    @Column({
        name: 'metric_type',
        type: 'enum',
        enum: MetricType,
    })
    metricType: MetricType;

    @Column({ type: 'float' })
    value: number; // 1-10 scale

    @Column({
        type: 'enum',
        enum: MetricSource,
    })
    source: MetricSource;

    @Column({ type: 'float', nullable: true })
    confidence?: number; // 0-1

    @Column({ type: 'jsonb', default: {} })
    context: {
        activityIds?: string[];
        voiceNoteIds?: string[];
        timeOfDay?: string;
        factors?: string[];
        notes?: string;
        calculationMethod?: string;
        rawData?: Record<string, any>;
    };

    // Relations
    @ManyToOne(() => User, (user) => user.performanceMetrics, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Helper methods
    get isHighConfidence(): boolean {
        return (this.confidence || 0) >= 0.7;
    }

    get isLowValue(): boolean {
        return this.value <= 4;
    }

    get isHighValue(): boolean {
        return this.value >= 7;
    }

    get valueCategory(): 'low' | 'medium' | 'high' {
        if (this.value <= 4) return 'low';
        if (this.value <= 7) return 'medium';
        return 'high';
    }

    get isReliable(): boolean {
        // AI inferred metrics with high confidence are most reliable
        if (this.source === MetricSource.AI_INFERRED && this.isHighConfidence) return true;

        // Self-reported metrics are reliable if not extreme values
        if (this.source === MetricSource.SELF_REPORTED && this.value > 1 && this.value < 10) return true;

        // Activity-based metrics are generally reliable
        if (this.source === MetricSource.ACTIVITY_BASED && (this.confidence || 0) >= 0.5) return true;

        return false;
    }

    // Static utility methods
    static calculateAverageByType(metrics: PerformanceMetric[], type: MetricType): number | null {
        const filtered = metrics.filter(m => m.metricType === type && m.isReliable);
        if (filtered.length === 0) return null;

        const sum = filtered.reduce((acc, m) => acc + m.value, 0);
        return Math.round((sum / filtered.length) * 10) / 10;
    }

    static calculateTrend(metrics: PerformanceMetric[], type: MetricType): {
        direction: 'up' | 'down' | 'stable';
        strength: number; // 0-1
        recentAverage: number;
        previousAverage: number;
    } | null {
        const filtered = metrics
            .filter(m => m.metricType === type && m.isReliable)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (filtered.length < 4) return null;

        const midpoint = Math.floor(filtered.length / 2);
        const recent = filtered.slice(midpoint);
        const previous = filtered.slice(0, midpoint);

        const recentAvg = recent.reduce((acc, m) => acc + m.value, 0) / recent.length;
        const previousAvg = previous.reduce((acc, m) => acc + m.value, 0) / previous.length;

        const difference = recentAvg - previousAvg;
        const strength = Math.min(Math.abs(difference) / 5, 1); // Normalize to 0-1

        let direction: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(difference) > 0.5) {
            direction = difference > 0 ? 'up' : 'down';
        }

        return {
            direction,
            strength: Math.round(strength * 100) / 100,
            recentAverage: Math.round(recentAvg * 10) / 10,
            previousAverage: Math.round(previousAvg * 10) / 10,
        };
    }

    static findCorrelations(
        metrics: PerformanceMetric[],
        type1: MetricType,
        type2: MetricType
    ): {
        correlation: number;
        strength: 'weak' | 'moderate' | 'strong';
        significance: number;
        sampleSize: number;
    } | null {
        const groupedByDate = metrics.reduce((acc, metric) => {
            if (!acc[metric.date]) acc[metric.date] = {
                [MetricType.ENERGY]: 0,
                [MetricType.FOCUS]: 0,
                [MetricType.PRODUCTIVITY]: 0,
                [MetricType.MOOD]: 0,
                [MetricType.STRESS]: 0,
                [MetricType.MOTIVATION]: 0,
            };
            acc[metric.date][metric.metricType] = metric.value;
            return acc;
        }, {} as Record<string, Record<MetricType, number>>);

        const pairs: Array<[number, number]> = [];
        Object.values(groupedByDate).forEach(dayMetrics => {
            if (dayMetrics[type1] && dayMetrics[type2]) {
                pairs.push([dayMetrics[type1], dayMetrics[type2]]);
            }
        });

        if (pairs.length < 5) return null;

        // Calculate Pearson correlation coefficient
        const n = pairs.length;
        const sumX = pairs.reduce((acc, [x]) => acc + x, 0);
        const sumY = pairs.reduce((acc, [, y]) => acc + y, 0);
        const sumXY = pairs.reduce((acc, [x, y]) => acc + x * y, 0);
        const sumXX = pairs.reduce((acc, [x]) => acc + x * x, 0);
        const sumYY = pairs.reduce((acc, [, y]) => acc + y * y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        if (denominator === 0) return null;

        const correlation = numerator / denominator;
        const absCorr = Math.abs(correlation);

        let strength: 'weak' | 'moderate' | 'strong' = 'weak';
        if (absCorr > 0.7) strength = 'strong';
        else if (absCorr > 0.4) strength = 'moderate';

        // Simple significance approximation
        const significance = Math.min(absCorr * Math.sqrt(n - 2) / Math.sqrt(1 - absCorr * absCorr), 1);

        return {
            correlation: Math.round(correlation * 100) / 100,
            strength,
            significance: Math.round(significance * 100) / 100,
            sampleSize: n,
        };
    }

    static generateInsights(metrics: PerformanceMetric[], userId: string): Array<{
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

        // Analyze each metric type
        Object.values(MetricType).forEach(type => {
            const trend = this.calculateTrend(metrics, type);
            if (trend && trend.strength > 0.3) {
                insights.push({
                    type: 'trend',
                    message: `Your ${type} has been trending ${trend.direction} with ${trend.strength > 0.7 ? 'strong' : 'moderate'} consistency`,
                    confidence: trend.strength,
                    data: trend,
                });
            }
        });

        // Find correlations between metrics
        const types = Object.values(MetricType);
        for (let i = 0; i < types.length; i++) {
            for (let j = i + 1; j < types.length; j++) {
                const correlation = this.findCorrelations(metrics, types[i], types[j]);
                if (correlation && correlation.strength !== 'weak') {
                    insights.push({
                        type: 'correlation',
                        message: `${types[i]} and ${types[j]} show ${correlation.strength} correlation (${correlation.correlation > 0 ? 'positive' : 'negative'})`,
                        confidence: correlation.significance,
                        data: { ...correlation, metric1: types[i], metric2: types[j] },
                    });
                }
            }
        }

        return insights.sort((a, b) => b.confidence - a.confidence);
    }
}