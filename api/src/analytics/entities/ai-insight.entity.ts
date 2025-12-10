import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum InsightType {
    CORRELATION = 'correlation',
    TREND = 'trend',
    ANOMALY = 'anomaly',
    PREDICTION = 'prediction',
    RECOMMENDATION = 'recommendation',
    WARNING = 'warning',
    OPPORTUNITY = 'opportunity',
}

export enum InsightCategory {
    HEALTH = 'health',
    PRODUCTIVITY = 'productivity',
    WELLBEING = 'wellbeing',
    RELATIONSHIPS = 'relationships',
    PERSONAL_GROWTH = 'personal_growth',
    HABITS = 'habits',
    SLEEP = 'sleep',
    EXERCISE = 'exercise',
}

export enum InsightStatus {
    NEW = 'new',
    SEEN = 'seen',
    ACTED_ON = 'acted_on',
    DISMISSED = 'dismissed',
    ARCHIVED = 'archived',
}

export enum ActionabilityLevel {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
    INFORMATIONAL = 'informational',
}

@Entity('ai_insights')
@Index(['userId', 'insightType'])
@Index(['category'])
@Index(['status'])
@Index(['actionabilityLevel'])
@Index(['confidence'])
@Index(['relevanceScore'])
@Index(['generatedAt'])
export class AIInsight extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({
        name: 'insight_type',
        type: 'enum',
        enum: InsightType,
    })
    insightType: InsightType;

    @Column({
        type: 'enum',
        enum: InsightCategory,
    })
    category: InsightCategory;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'text', nullable: true })
    explanation?: string; // How the insight was derived

    @Column({
        type: 'enum',
        enum: ActionabilityLevel,
    })
    actionabilityLevel: ActionabilityLevel;

    @Column({ type: 'float' })
    confidence: number; // 0-1

    @Column({ name: 'relevance_score', type: 'float' })
    relevanceScore: number; // 0-1

    @Column({ name: 'generated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    generatedAt: Date;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt?: Date;

    @Column({
        type: 'enum',
        enum: InsightStatus,
        default: InsightStatus.NEW,
    })
    status: InsightStatus;

    @Column({ name: 'user_feedback', type: 'text', nullable: true })
    userFeedback?: string;

    @Column({ name: 'user_rating', type: 'int', nullable: true })
    userRating?: number; // 1-5 stars

    @Column({ type: 'jsonb' })
    data: {
        sources: Array<{
            type: string; // 'activity', 'sleep', 'journal', 'performance_metric', etc.
            id?: string;
            timeRange?: {
                start: string;
                end: string;
            };
            weight: number; // How much this source contributed
        }>;
        metrics?: Array<{
            name: string;
            value: number;
            unit?: string;
            change?: number;
            trend?: 'up' | 'down' | 'stable';
        }>;
        predictions?: Array<{
            outcome: string;
            probability: number;
            timeframe: string;
            conditions?: string[];
        }>;
        correlations?: Array<{
            variable1: string;
            variable2: string;
            correlation: number;
            significance: number;
        }>;
        anomalies?: Array<{
            type: string;
            severity: 'low' | 'medium' | 'high';
            details: string;
            expectedValue?: number;
            actualValue?: number;
        }>;
    };

    @Column({ type: 'jsonb', default: [] })
    recommendations: Array<{
        action: string;
        difficulty: 'easy' | 'medium' | 'hard';
        expectedImpact: number; // 0-1
        timeframe: string;
        steps?: string[];
        resources?: Array<{
            type: string;
            url?: string;
            description: string;
        }>;
    }>;

    @Column({ type: 'jsonb', default: {} })
    metadata: {
        algorithm?: string;
        version?: string;
        processingTime?: number;
        dataPoints?: number;
        similarInsights?: string[]; // IDs of related insights
        tags?: string[];
        priority?: 'low' | 'medium' | 'high' | 'critical';
        dismissalReason?: string;
    };

    // Relations
    @ManyToOne(() => User, (user) => user.aiInsights, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Computed properties
    get isValid(): boolean {
        return !this.expiresAt || this.expiresAt > new Date();
    }

    get isHighValue(): boolean {
        return this.confidence >= 0.7 &&
            this.relevanceScore >= 0.7 &&
            this.actionabilityLevel !== ActionabilityLevel.INFORMATIONAL;
    }

    get priorityScore(): number {
        const confidenceWeight = 0.3;
        const relevanceWeight = 0.3;
        const actionabilityWeight = 0.2;
        const freshnessWeight = 0.1;
        const typeWeight = 0.1;

        const actionabilityScore = {
            [ActionabilityLevel.HIGH]: 1,
            [ActionabilityLevel.MEDIUM]: 0.7,
            [ActionabilityLevel.LOW]: 0.4,
            [ActionabilityLevel.INFORMATIONAL]: 0.1,
        }[this.actionabilityLevel];

        const typeScore = {
            [InsightType.WARNING]: 1,
            [InsightType.OPPORTUNITY]: 0.9,
            [InsightType.RECOMMENDATION]: 0.8,
            [InsightType.PREDICTION]: 0.7,
            [InsightType.ANOMALY]: 0.6,
            [InsightType.CORRELATION]: 0.5,
            [InsightType.TREND]: 0.4,
        }[this.insightType];

        // Freshness: newer insights score higher
        const daysSinceGeneration = (new Date().getTime() - this.generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        const freshnessScore = Math.max(0, 1 - daysSinceGeneration / 30); // Decay over 30 days

        return Math.round((
            this.confidence * confidenceWeight +
            this.relevanceScore * relevanceWeight +
            actionabilityScore * actionabilityWeight +
            freshnessScore * freshnessWeight +
            typeScore * typeWeight
        ) * 100) / 100;
    }

    get shouldNotify(): boolean {
        return this.status === InsightStatus.NEW &&
            this.isValid &&
            (this.insightType === InsightType.WARNING ||
                this.insightType === InsightType.OPPORTUNITY) &&
            this.priorityScore >= 0.7;
    }

    // Methods
    markAsSeen(): void {
        if (this.status === InsightStatus.NEW) {
            this.status = InsightStatus.SEEN;
        }
    }

    markAsActedOn(): void {
        this.status = InsightStatus.ACTED_ON;
    }

    dismiss(reason?: string): void {
        this.status = InsightStatus.DISMISSED;
        if (reason) {
            this.metadata = {
                ...this.metadata,
                dismissalReason: reason
            };
        }
    }

    addUserFeedback(rating: number, feedback?: string): void {
        this.userRating = Math.max(1, Math.min(5, Math.round(rating)));
        this.userFeedback = feedback;

        // Adjust relevance score based on feedback
        if (rating >= 4) {
            this.relevanceScore = Math.min(this.relevanceScore + 0.1, 1);
        } else if (rating <= 2) {
            this.relevanceScore = Math.max(this.relevanceScore - 0.1, 0);
        }
    }

    isExpiringSoon(): boolean {
        if (!this.expiresAt) return false;
        const daysUntilExpiry = (this.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 3;
    }

    generateSummary(): string {
        const actionText = this.recommendations.length > 0
            ? ` Recommended actions: ${this.recommendations.length}`
            : '';

        return `${this.insightType.toUpperCase()}: ${this.title}. ` +
            `Confidence: ${Math.round(this.confidence * 100)}%, ` +
            `Relevance: ${Math.round(this.relevanceScore * 100)}%.${actionText}`;
    }

    // Static methods for analysis and management
    static prioritizeInsights(insights: AIInsight[]): AIInsight[] {
        return insights
            .filter(insight => insight.isValid && insight.status !== InsightStatus.DISMISSED)
            .sort((a, b) => {
                // Critical priority first
                if (a.metadata.priority === 'critical' && b.metadata.priority !== 'critical') return -1;
                if (b.metadata.priority === 'critical' && a.metadata.priority !== 'critical') return 1;

                // Then by priority score
                return b.priorityScore - a.priorityScore;
            });
    }

    static findDuplicates(insights: AIInsight[]): Array<{
        original: AIInsight;
        duplicates: AIInsight[];
        similarity: number;
    }> {
        const duplicateGroups: Array<{
            original: AIInsight;
            duplicates: AIInsight[];
            similarity: number;
        }> = [];

        for (let i = 0; i < insights.length; i++) {
            const current = insights[i];
            const duplicates: AIInsight[] = [];

            for (let j = i + 1; j < insights.length; j++) {
                const other = insights[j];
                const similarity = this.calculateSimilarity(current, other);

                if (similarity >= 0.8) {
                    duplicates.push(other);
                }
            }

            if (duplicates.length > 0) {
                duplicateGroups.push({
                    original: current,
                    duplicates,
                    similarity: Math.max(...duplicates.map(d => this.calculateSimilarity(current, d))),
                });
            }
        }

        return duplicateGroups;
    }

    private static calculateSimilarity(insight1: AIInsight, insight2: AIInsight): number {
        // Simple similarity calculation based on title, type, and category
        let similarity = 0;

        if (insight1.insightType === insight2.insightType) similarity += 0.3;
        if (insight1.category === insight2.category) similarity += 0.2;

        // Title similarity (basic word overlap)
        const words1 = insight1.title.toLowerCase().split(' ');
        const words2 = insight2.title.toLowerCase().split(' ');
        const commonWords = words1.filter(word => words2.includes(word));
        const titleSimilarity = commonWords.length / Math.max(words1.length, words2.length);
        similarity += titleSimilarity * 0.5;

        return similarity;
    }

    static generateDashboardInsights(insights: AIInsight[]): {
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
    } {
        const activeInsights = insights.filter(i => i.isValid && i.status !== InsightStatus.DISMISSED);

        // Summary statistics
        const summary = {
            total: activeInsights.length,
            new: activeInsights.filter(i => i.status === InsightStatus.NEW).length,
            highPriority: activeInsights.filter(i => i.priorityScore >= 0.8).length,
            actionable: activeInsights.filter(i => i.actionabilityLevel === ActionabilityLevel.HIGH).length,
        };

        // Trends analysis
        const typeCounts = activeInsights.reduce((acc, i) => {
            acc[i.insightType] = (acc[i.insightType] || 0) + 1;
            return acc;
        }, {} as Record<InsightType, number>);

        const categoryCounts = activeInsights.reduce((acc, i) => {
            acc[i.category] = (acc[i.category] || 0) + 1;
            return acc;
        }, {} as Record<InsightCategory, number>);

        const mostCommonType = Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] as InsightType;
        const mostCommonCategory = Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] as InsightCategory;

        const averageConfidence = activeInsights.length > 0
            ? activeInsights.reduce((acc, i) => acc + i.confidence, 0) / activeInsights.length
            : 0;

        const averageRelevance = activeInsights.length > 0
            ? activeInsights.reduce((acc, i) => acc + i.relevanceScore, 0) / activeInsights.length
            : 0;

        const trends = {
            mostCommonType,
            mostCommonCategory,
            averageConfidence: Math.round(averageConfidence * 100) / 100,
            averageRelevance: Math.round(averageRelevance * 100) / 100,
        };

        // Recommendations aggregation
        const allRecommendations = activeInsights.flatMap(i => i.recommendations);
        const actionCounts = allRecommendations.reduce((acc, rec) => {
            acc[rec.action] = (acc[rec.action] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topActions = Object.entries(actionCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([action]) => action);

        const quickWins = allRecommendations
            .filter(rec => rec.difficulty === 'easy' && rec.expectedImpact >= 0.6)
            .sort((a, b) => b.expectedImpact - a.expectedImpact)
            .slice(0, 3)
            .map(rec => ({
                action: rec.action,
                impact: rec.expectedImpact,
            }));

        const recommendations = {
            topActions,
            quickWins,
        };

        return {
            summary,
            trends,
            recommendations,
        };
    }

    static cleanupExpiredInsights(insights: AIInsight[]): string[] {
        const expired = insights.filter(insight =>
            insight.expiresAt &&
            insight.expiresAt <= new Date() &&
            insight.status !== InsightStatus.ACTED_ON
        );

        return expired.map(insight => insight.id);
    }
}