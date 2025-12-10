import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum CorrelationType {
    ACTIVITY_PERFORMANCE = 'activity_performance',
    SLEEP_PERFORMANCE = 'sleep_performance',
    TEMPORAL_PATTERN = 'temporal_pattern',
    BEHAVIORAL_SEQUENCE = 'behavioral_sequence',
    EXTERNAL_FACTOR = 'external_factor',
}

export enum CorrelationStrength {
    WEAK = 'weak',
    MODERATE = 'moderate',
    STRONG = 'strong',
    VERY_STRONG = 'very_strong',
}

@Entity('life_correlations')
@Index(['userId', 'correlationType'])
@Index(['strength'])
@Index(['confidence'])
@Index(['significance'])
export class LifeCorrelation extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({
        name: 'correlation_type',
        type: 'enum',
        enum: CorrelationType,
    })
    correlationType: CorrelationType;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'float' })
    coefficient: number; // -1 to 1

    @Column({
        type: 'enum',
        enum: CorrelationStrength,
    })
    strength: CorrelationStrength;

    @Column({ type: 'float' })
    confidence: number; // 0-1

    @Column({ type: 'float' })
    significance: number; // Statistical significance

    @Column({ name: 'sample_size', type: 'int' })
    sampleSize: number;

    @Column({ name: 'discovery_date', type: 'timestamp' })
    discoveryDate: Date;

    @Column({ name: 'last_updated', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastUpdated: Date;

    @Column({ name: 'is_validated', type: 'boolean', default: false })
    isValidated: boolean;

    @Column({ name: 'user_feedback', type: 'text', nullable: true })
    userFeedback?: string;

    @Column({ type: 'jsonb' })
    data: {
        variables: Array<{
            name: string;
            type: string;
            values?: any[];
            weight?: number;
        }>;
        timeRange: {
            start: string;
            end: string;
            duration: string;
        };
        patterns: Array<{
            pattern: string;
            frequency: number;
            examples: string[];
        }>;
        recommendations: string[];
        caveats?: string[];
        relatedInsights?: string[];
    };

    @Column({ type: 'jsonb', default: {} })
    metadata: {
        algorithm?: string;
        version?: string;
        dataQuality?: number;
        biases?: string[];
        limitations?: string[];
        reviewedBy?: string;
        tags?: string[];
    };

    // Relations
    @ManyToOne(() => User, (user) => user.lifeCorrelations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Computed properties
    get isReliable(): boolean {
        return this.confidence >= 0.7 &&
            this.significance >= 0.05 &&
            this.sampleSize >= 10;
    }

    get isActionable(): boolean {
        return this.isReliable &&
            this.data.recommendations.length > 0 &&
            (this.strength === CorrelationStrength.STRONG ||
                this.strength === CorrelationStrength.VERY_STRONG);
    }

    get reliabilityScore(): number {
        const confidenceWeight = 0.4;
        const significanceWeight = 0.3;
        const sampleSizeWeight = 0.2;
        const strengthWeight = 0.1;

        const normalizedSampleSize = Math.min(this.sampleSize / 50, 1);
        const strengthScore = {
            [CorrelationStrength.WEAK]: 0.25,
            [CorrelationStrength.MODERATE]: 0.5,
            [CorrelationStrength.STRONG]: 0.75,
            [CorrelationStrength.VERY_STRONG]: 1,
        }[this.strength];

        return Math.round((
            this.confidence * confidenceWeight +
            this.significance * significanceWeight +
            normalizedSampleSize * sampleSizeWeight +
            strengthScore * strengthWeight
        ) * 100) / 100;
    }

    get impactPotential(): 'low' | 'medium' | 'high' {
        if (!this.isActionable) return 'low';

        const absCoefficient = Math.abs(this.coefficient);
        if (absCoefficient >= 0.7 && this.strength === CorrelationStrength.VERY_STRONG) {
            return 'high';
        }
        if (absCoefficient >= 0.5 && this.strength === CorrelationStrength.STRONG) {
            return 'medium';
        }
        return 'low';
    }

    // Methods
    addUserFeedback(feedback: string, isValid: boolean): void {
        this.userFeedback = feedback;
        this.isValidated = isValid;
        this.lastUpdated = new Date();

        // Adjust confidence based on feedback
        if (isValid) {
            this.confidence = Math.min(this.confidence + 0.1, 1);
        } else {
            this.confidence = Math.max(this.confidence - 0.2, 0);
        }
    }

    generateSummary(): string {
        const direction = this.coefficient > 0 ? 'positively' : 'negatively';
        const strengthDesc = this.strength.replace('_', ' ');

        return `Found ${strengthDesc} ${direction} correlated relationship: ${this.title}. ` +
            `Confidence: ${Math.round(this.confidence * 100)}%, ` +
            `Sample size: ${this.sampleSize} data points.`;
    }

    // Static methods for analysis
    static calculateStrength(coefficient: number): CorrelationStrength {
        const abs = Math.abs(coefficient);
        if (abs >= 0.8) return CorrelationStrength.VERY_STRONG;
        if (abs >= 0.6) return CorrelationStrength.STRONG;
        if (abs >= 0.3) return CorrelationStrength.MODERATE;
        return CorrelationStrength.WEAK;
    }

    static findConflictingCorrelations(correlations: LifeCorrelation[]): Array<{
        correlation1: LifeCorrelation;
        correlation2: LifeCorrelation;
        conflictReason: string;
    }> {
        const conflicts: Array<{
            correlation1: LifeCorrelation;
            correlation2: LifeCorrelation;
            conflictReason: string;
        }> = [];

        for (let i = 0; i < correlations.length; i++) {
            for (let j = i + 1; j < correlations.length; j++) {
                const corr1 = correlations[i];
                const corr2 = correlations[j];

                // Check for opposite correlations
                if (this.areOpposite(corr1, corr2)) {
                    conflicts.push({
                        correlation1: corr1,
                        correlation2: corr2,
                        conflictReason: 'Opposite correlation directions detected',
                    });
                }

                // Check for overlapping variables with different outcomes
                if (this.haveOverlappingVariables(corr1, corr2) &&
                    Math.sign(corr1.coefficient) !== Math.sign(corr2.coefficient)) {
                    conflicts.push({
                        correlation1: corr1,
                        correlation2: corr2,
                        conflictReason: 'Similar variables with opposite effects',
                    });
                }
            }
        }

        return conflicts;
    }

    private static areOpposite(corr1: LifeCorrelation, corr2: LifeCorrelation): boolean {
        return corr1.title === corr2.title &&
            Math.sign(corr1.coefficient) !== Math.sign(corr2.coefficient);
    }

    private static haveOverlappingVariables(corr1: LifeCorrelation, corr2: LifeCorrelation): boolean {
        const vars1 = corr1.data.variables.map(v => v.name.toLowerCase());
        const vars2 = corr2.data.variables.map(v => v.name.toLowerCase());

        return vars1.some(v1 => vars2.some(v2 =>
            v1.includes(v2) || v2.includes(v1) ||
            this.areSimilarVariables(v1, v2)
        ));
    }

    private static areSimilarVariables(var1: string, var2: string): boolean {
        const synonyms = [
            ['sleep', 'rest', 'bedtime'],
            ['exercise', 'workout', 'fitness', 'activity'],
            ['mood', 'emotion', 'feeling'],
            ['energy', 'vitality', 'alertness'],
            ['stress', 'anxiety', 'pressure'],
            ['productivity', 'performance', 'output'],
        ];

        return synonyms.some(group =>
            group.some(word => var1.includes(word)) &&
            group.some(word => var2.includes(word))
        );
    }

    static prioritizeForUser(correlations: LifeCorrelation[]): LifeCorrelation[] {
        return correlations
            .filter(c => c.isReliable)
            .sort((a, b) => {
                // Primary: actionable correlations first
                if (a.isActionable !== b.isActionable) {
                    return a.isActionable ? -1 : 1;
                }

                // Secondary: reliability score
                if (Math.abs(a.reliabilityScore - b.reliabilityScore) > 0.1) {
                    return b.reliabilityScore - a.reliabilityScore;
                }

                // Tertiary: impact potential
                const impactOrder = { high: 3, medium: 2, low: 1 };
                return impactOrder[b.impactPotential] - impactOrder[a.impactPotential];
            });
    }
}