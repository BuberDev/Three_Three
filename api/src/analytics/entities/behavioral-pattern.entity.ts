import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum PatternType {
    TEMPORAL = 'temporal',
    SEQUENTIAL = 'sequential',
    CYCLICAL = 'cyclical',
    TRIGGER_RESPONSE = 'trigger_response',
    HABIT_FORMATION = 'habit_formation',
    ANOMALY = 'anomaly',
}

export enum PatternFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    SEASONAL = 'seasonal',
    IRREGULAR = 'irregular',
}

export enum PatternStrength {
    WEAK = 'weak',
    MODERATE = 'moderate',
    STRONG = 'strong',
    VERY_STRONG = 'very_strong',
}

@Entity('behavioral_patterns')
@Index(['userId', 'patternType'])
@Index(['strength'])
@Index(['frequency'])
@Index(['confidence'])
export class BehavioralPattern extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({
        name: 'pattern_type',
        type: 'enum',
        enum: PatternType,
    })
    patternType: PatternType;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({
        type: 'enum',
        enum: PatternFrequency,
    })
    frequency: PatternFrequency;

    @Column({
        type: 'enum',
        enum: PatternStrength,
    })
    strength: PatternStrength;

    @Column({ type: 'float' })
    confidence: number; // 0-1

    @Column({ name: 'occurrences', type: 'int' })
    occurrences: number;

    @Column({ name: 'first_observed', type: 'date' })
    firstObserved: string;

    @Column({ name: 'last_observed', type: 'date' })
    lastObserved: string;

    @Column({ name: 'next_predicted', type: 'date', nullable: true })
    nextPredicted?: string;

    @Column({ name: 'prediction_confidence', type: 'float', nullable: true })
    predictionConfidence?: number;

    @Column({ name: 'is_beneficial', type: 'boolean', nullable: true })
    isBeneficial?: boolean; // true for good habits, false for bad ones, null for neutral

    @Column({ name: 'user_acknowledged', type: 'boolean', default: false })
    userAcknowledged: boolean;

    @Column({ type: 'jsonb' })
    data: {
        triggers?: Array<{
            type: string;
            description: string;
            frequency: number;
            confidence: number;
        }>;
        sequence?: Array<{
            step: number;
            action: string;
            duration?: string;
            probability: number;
        }>;
        conditions: Array<{
            variable: string;
            operator: string;
            value: any;
            importance: number;
        }>;
        outcomes: Array<{
            metric: string;
            impact: number; // -1 to 1
            confidence: number;
            examples: string[];
        }>;
        timing: {
            timeOfDay?: string[];
            dayOfWeek?: string[];
            monthOfYear?: string[];
            duration?: {
                average: string;
                range: [string, string];
            };
        };
        exceptions?: Array<{
            condition: string;
            frequency: number;
            reason?: string;
        }>;
    };

    @Column({ type: 'jsonb', default: {} })
    analytics: {
        trendDirection?: 'increasing' | 'decreasing' | 'stable';
        lastMonthOccurrences?: number;
        averageInterval?: string;
        variability?: number; // 0-1, how consistent the pattern is
        seasonality?: {
            hasSeasonality: boolean;
            peakPeriods?: string[];
            lowPeriods?: string[];
        };
        correlatedPatterns?: Array<{
            patternId: string;
            correlation: number;
            description: string;
        }>;
    };

    @Column({ type: 'jsonb', default: {} })
    recommendations: {
        suggestions: Array<{
            type: 'reinforce' | 'modify' | 'interrupt' | 'optimize';
            description: string;
            difficulty: 'easy' | 'medium' | 'hard';
            expectedImpact: number; // 0-1
            timeframe: string;
        }>;
        warnings?: string[];
        opportunities?: string[];
    };

    // Relations
    @ManyToOne(() => User, (user) => user.behavioralPatterns, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Computed properties
    get isReliable(): boolean {
        return this.confidence >= 0.6 &&
            this.occurrences >= 3 &&
            this.strength !== PatternStrength.WEAK;
    }

    get isActionable(): boolean {
        return this.isReliable &&
            this.recommendations.suggestions.length > 0 &&
            this.isBeneficial !== null;
    }

    get consistencyScore(): number {
        const variability = this.analytics.variability || 1;
        const occurrenceScore = Math.min(this.occurrences / 10, 1);
        const confidenceWeight = 0.4;
        const variabilityWeight = 0.4;
        const occurrenceWeight = 0.2;

        return Math.round((
            this.confidence * confidenceWeight +
            (1 - variability) * variabilityWeight +
            occurrenceScore * occurrenceWeight
        ) * 100) / 100;
    }

    get priority(): 'low' | 'medium' | 'high' {
        if (!this.isActionable) return 'low';

        // High priority for strong negative patterns or strong positive patterns
        if (this.strength === PatternStrength.VERY_STRONG || this.strength === PatternStrength.STRONG) {
            if (this.isBeneficial === false) return 'high'; // Break bad habits
            if (this.isBeneficial === true && this.analytics.trendDirection === 'decreasing') return 'high'; // Restore good habits
        }

        if (this.consistencyScore >= 0.7) return 'medium';
        return 'low';
    }

    get nextOccurrenceProbability(): number {
        if (!this.nextPredicted) return 0;

        const daysDiff = Math.abs(
            (new Date(this.nextPredicted).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // Base probability from prediction confidence
        let probability = this.predictionConfidence || 0.5;

        // Adjust based on how close we are to predicted date
        if (daysDiff <= 1) probability *= 1.2;
        else if (daysDiff <= 3) probability *= 1.1;
        else if (daysDiff > 7) probability *= 0.8;

        // Adjust based on pattern strength
        const strengthMultipliers = {
            [PatternStrength.VERY_STRONG]: 1.3,
            [PatternStrength.STRONG]: 1.15,
            [PatternStrength.MODERATE]: 1.0,
            [PatternStrength.WEAK]: 0.8,
        };

        probability *= strengthMultipliers[this.strength];

        return Math.min(probability, 1);
    }

    // Methods
    acknowledge(): void {
        this.userAcknowledged = true;
    }

    updateBeneficialStatus(isBeneficial: boolean): void {
        this.isBeneficial = isBeneficial;
        this.generateRecommendations();
    }

    private generateRecommendations(): void {
        const suggestions: Array<{
            type: 'reinforce' | 'modify' | 'interrupt' | 'optimize';
            description: string;
            difficulty: 'easy' | 'medium' | 'hard';
            expectedImpact: number;
            timeframe: string;
        }> = [];

        if (this.isBeneficial === true) {
            // Good pattern - reinforce or optimize
            suggestions.push({
                type: 'reinforce',
                description: `Continue ${this.title.toLowerCase()} as it shows positive outcomes`,
                difficulty: 'easy',
                expectedImpact: 0.7,
                timeframe: 'ongoing',
            });

            if (this.analytics.trendDirection === 'decreasing') {
                suggestions.push({
                    type: 'optimize',
                    description: `Identify barriers preventing consistent ${this.title.toLowerCase()}`,
                    difficulty: 'medium',
                    expectedImpact: 0.8,
                    timeframe: '1-2 weeks',
                });
            }
        } else if (this.isBeneficial === false) {
            // Bad pattern - interrupt or modify
            suggestions.push({
                type: 'interrupt',
                description: `Break the cycle of ${this.title.toLowerCase()} by changing triggers`,
                difficulty: 'medium',
                expectedImpact: 0.8,
                timeframe: '2-4 weeks',
            });

            if (this.data.triggers && this.data.triggers.length > 0) {
                suggestions.push({
                    type: 'modify',
                    description: `Replace triggers with healthier alternatives`,
                    difficulty: 'hard',
                    expectedImpact: 0.9,
                    timeframe: '4-8 weeks',
                });
            }
        }

        this.recommendations = { suggestions };
    }

    // Static methods
    static findRelatedPatterns(
        patterns: BehavioralPattern[],
        targetPattern: BehavioralPattern
    ): Array<{
        pattern: BehavioralPattern;
        relationship: 'reinforcing' | 'competing' | 'sequential' | 'conditional';
        strength: number;
    }> {
        const related: Array<{
            pattern: BehavioralPattern;
            relationship: 'reinforcing' | 'competing' | 'sequential' | 'conditional';
            strength: number;
        }> = [];

        patterns.forEach(pattern => {
            if (pattern.id === targetPattern.id) return;

            // Check for temporal overlap
            const timeOverlap = this.calculateTimeOverlap(pattern, targetPattern);

            // Check for condition overlap
            const conditionOverlap = this.calculateConditionOverlap(pattern, targetPattern);

            // Check for outcome correlation
            const outcomeCorrelation = this.calculateOutcomeCorrelation(pattern, targetPattern);

            let relationship: 'reinforcing' | 'competing' | 'sequential' | 'conditional';
            let strength = 0;

            if (timeOverlap > 0.7) {
                relationship = outcomeCorrelation > 0 ? 'reinforcing' : 'competing';
                strength = timeOverlap * Math.abs(outcomeCorrelation);
            } else if (conditionOverlap > 0.5) {
                relationship = 'conditional';
                strength = conditionOverlap;
            } else if (this.isSequential(pattern, targetPattern)) {
                relationship = 'sequential';
                strength = 0.6;
            } else {
                return; // Not related enough
            }

            if (strength > 0.3) {
                related.push({ pattern, relationship, strength });
            }
        });

        return related.sort((a, b) => b.strength - a.strength);
    }

    private static calculateTimeOverlap(p1: BehavioralPattern, p2: BehavioralPattern): number {
        const t1 = p1.data.timing;
        const t2 = p2.data.timing;

        let overlap = 0;
        let factors = 0;

        // Time of day overlap
        if (t1.timeOfDay && t2.timeOfDay) {
            const commonTimes = t1.timeOfDay.filter(time => t2.timeOfDay!.includes(time));
            overlap += commonTimes.length / Math.max(t1.timeOfDay.length, t2.timeOfDay.length);
            factors++;
        }

        // Day of week overlap
        if (t1.dayOfWeek && t2.dayOfWeek) {
            const commonDays = t1.dayOfWeek.filter(day => t2.dayOfWeek!.includes(day));
            overlap += commonDays.length / Math.max(t1.dayOfWeek.length, t2.dayOfWeek.length);
            factors++;
        }

        return factors > 0 ? overlap / factors : 0;
    }

    private static calculateConditionOverlap(p1: BehavioralPattern, p2: BehavioralPattern): number {
        const c1 = p1.data.conditions;
        const c2 = p2.data.conditions;

        let commonVariables = 0;
        let totalVariables = new Set([...c1.map(c => c.variable), ...c2.map(c => c.variable)]).size;

        c1.forEach(condition1 => {
            c2.forEach(condition2 => {
                if (condition1.variable === condition2.variable) {
                    commonVariables++;
                }
            });
        });

        return commonVariables / totalVariables;
    }

    private static calculateOutcomeCorrelation(p1: BehavioralPattern, p2: BehavioralPattern): number {
        const o1 = p1.data.outcomes;
        const o2 = p2.data.outcomes;

        let totalCorrelation = 0;
        let commonMetrics = 0;

        o1.forEach(outcome1 => {
            o2.forEach(outcome2 => {
                if (outcome1.metric === outcome2.metric) {
                    totalCorrelation += outcome1.impact * outcome2.impact;
                    commonMetrics++;
                }
            });
        });

        return commonMetrics > 0 ? totalCorrelation / commonMetrics : 0;
    }

    private static isSequential(p1: BehavioralPattern, p2: BehavioralPattern): boolean {
        // Simple heuristic: if one pattern's typical end time is close to another's start time
        if (!p1.data.timing.timeOfDay || !p2.data.timing.timeOfDay) return false;

        // This is a simplified check - in reality, you'd need more sophisticated temporal analysis
        return false; // Placeholder
    }

    static generateInsights(patterns: BehavioralPattern[]): Array<{
        type: string;
        message: string;
        patterns: string[];
        recommendations: string[];
    }> {
        const insights: Array<{
            type: string;
            message: string;
            patterns: string[];
            recommendations: string[];
        }> = [];

        // Find pattern clusters
        const clusters = this.findPatternClusters(patterns);
        clusters.forEach(cluster => {
            if (cluster.length >= 2) {
                insights.push({
                    type: 'cluster',
                    message: `Found ${cluster.length} related patterns that often occur together`,
                    patterns: cluster.map(p => p.title),
                    recommendations: ['Consider addressing these patterns as a group for better results'],
                });
            }
        });

        // Find conflicting patterns
        const conflicts = this.findConflictingPatterns(patterns);
        conflicts.forEach(conflict => {
            insights.push({
                type: 'conflict',
                message: `Competing behaviors detected between ${conflict.pattern1.title} and ${conflict.pattern2.title}`,
                patterns: [conflict.pattern1.title, conflict.pattern2.title],
                recommendations: [
                    'Choose one pattern to focus on',
                    'Schedule these activities at different times',
                ],
            });
        });

        return insights;
    }

    private static findPatternClusters(patterns: BehavioralPattern[]): BehavioralPattern[][] {
        const clusters: BehavioralPattern[][] = [];
        const processed = new Set<string>();

        patterns.forEach(pattern => {
            if (processed.has(pattern.id)) return;

            const cluster = [pattern];
            processed.add(pattern.id);

            const related = this.findRelatedPatterns(patterns, pattern);
            related.forEach(({ pattern: relatedPattern, strength }) => {
                if (strength > 0.6 && !processed.has(relatedPattern.id)) {
                    cluster.push(relatedPattern);
                    processed.add(relatedPattern.id);
                }
            });

            if (cluster.length > 1) {
                clusters.push(cluster);
            }
        });

        return clusters;
    }

    private static findConflictingPatterns(patterns: BehavioralPattern[]): Array<{
        pattern1: BehavioralPattern;
        pattern2: BehavioralPattern;
        conflictReason: string;
    }> {
        const conflicts: Array<{
            pattern1: BehavioralPattern;
            pattern2: BehavioralPattern;
            conflictReason: string;
        }> = [];

        for (let i = 0; i < patterns.length; i++) {
            for (let j = i + 1; j < patterns.length; j++) {
                const p1 = patterns[i];
                const p2 = patterns[j];

                const timeOverlap = this.calculateTimeOverlap(p1, p2);
                const outcomeCorrelation = this.calculateOutcomeCorrelation(p1, p2);

                if (timeOverlap > 0.8 && outcomeCorrelation < -0.5) {
                    conflicts.push({
                        pattern1: p1,
                        pattern2: p2,
                        conflictReason: 'Time conflict with opposing outcomes',
                    });
                }
            }
        }

        return conflicts;
    }
}