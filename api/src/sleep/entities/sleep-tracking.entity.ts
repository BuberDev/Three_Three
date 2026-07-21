import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
// import { SleepEvent } from './sleep-event.entity'; // Temporarily disabled for debugging

export enum SnoringIntensity {
    NONE = 'none',
    LIGHT = 'light',
    MODERATE = 'moderate',
    HEAVY = 'heavy',
}

export enum SleepProcessingStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('sleep_tracking')
@Index(['userId', 'sleepDate'], { unique: true })
@Index(['sleepQualityScore'])
export class SleepTracking extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'sleep_date', type: 'date' })
    sleepDate: string;

    @Column({ name: 'recording_start_time', type: 'timestamp with time zone', nullable: true })
    recordingStartTime?: Date;

    @Column({ name: 'recording_end_time', type: 'timestamp with time zone', nullable: true })
    recordingEndTime?: Date;

    @Column({ name: 'audio_files', type: 'jsonb', default: [] })
    audioFiles: Array<{
        url: string;
        duration: number;
        segment: number;
        size: number;
    }>;

    @Column({ name: 'sleep_duration_hours', type: 'float', nullable: true })
    sleepDurationHours?: number;

    @Column({ name: 'snoring_detected', default: false })
    snoringDetected: boolean;

    @Column({
        name: 'snoring_intensity',
        type: 'varchar',
        length: 20,
        default: SnoringIntensity.NONE,
    })
    snoringIntensity: SnoringIntensity;

    @Column({ name: 'sleep_talking_detected', default: false })
    sleepTalkingDetected: boolean;

    @Column({ name: 'sleep_talking_frequency', default: 0 })
    sleepTalkingFrequency: number;

    @Column({ name: 'sleep_quality_score', type: 'decimal', precision: 3, scale: 1, nullable: true })
    sleepQualityScore?: number; // 1-10 (allows decimals like 8.2)

    @Column({ name: 'awakenings_count', default: 0 })
    awakeningsCount: number;

    @Column({ name: 'sleep_efficiency', type: 'integer', nullable: true })
    sleepEfficiency?: number; // 0-100 percentage

    @Column({ name: 'analysis_completed', default: false })
    analysisCompleted: boolean;

    @Column({ name: 'analysis_metadata', type: 'jsonb', default: {} })
    analysisMetadata: {
        deepSleepPercentage?: number;
        lightSleepPercentage?: number;
        remSleepPercentage?: number;
        noiseLevel?: number;
        roomTemperature?: number;
        environmentalFactors?: string[];
        sleepEfficiency?: number;
        timeToFallAsleep?: number; // minutes
        longestAwakePeriod?: number; // minutes
        averageHeartRate?: number;
        oxygenSaturation?: number;
    };

    @Column({
        name: 'processing_status',
        type: 'varchar',
        length: 20,
        default: SleepProcessingStatus.PENDING,
    })
    processingStatus: SleepProcessingStatus;

    @Column({ name: 'processing_error', type: 'text', nullable: true })
    processingError?: string;

    // Relations
    @ManyToOne(() => User, (user) => user.sleepSessions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
    // Sleep events relation - temporarily disabled for debugging
    // @OneToMany(() => SleepEvent, (sleepEvent) => sleepEvent.sleepTracking, {
    //     cascade: true,
    //     eager: false,
    // })
    // events: SleepEvent[];
    // Computed properties
    get totalRecordingTime(): number | null {
        if (!this.recordingStartTime || !this.recordingEndTime) return null;
        return (this.recordingEndTime.getTime() - this.recordingStartTime.getTime()) / (1000 * 60 * 60);
    }

    get hasSleepDisturbances(): boolean {
        return this.snoringDetected ||
            this.sleepTalkingDetected ||
            this.awakeningsCount > 2;
    }

    get sleepQuality(): 'poor' | 'fair' | 'good' | 'excellent' | null {
        if (!this.sleepQualityScore) return null;

        if (this.sleepQualityScore <= 3) return 'poor';
        if (this.sleepQualityScore <= 5) return 'fair';
        if (this.sleepQualityScore <= 7) return 'good';
        return 'excellent';
    }

    // Analysis helper methods
    calculateSleepScore(): number {
        let score = 10;

        // Deduct points for disturbances
        if (this.snoringDetected) {
            switch (this.snoringIntensity) {
                case SnoringIntensity.LIGHT: score -= 1; break;
                case SnoringIntensity.MODERATE: score -= 2; break;
                case SnoringIntensity.HEAVY: score -= 3; break;
            }
        }

        // Deduct for awakenings
        score -= Math.min(this.awakeningsCount * 0.5, 2);

        // Deduct for sleep talking
        if (this.sleepTalkingDetected) {
            score -= Math.min(this.sleepTalkingFrequency * 0.3, 1.5);
        }

        // Duration factors
        if (this.sleepDurationHours) {
            if (this.sleepDurationHours < 6) score -= 2;
            else if (this.sleepDurationHours < 7) score -= 1;
            else if (this.sleepDurationHours > 9) score -= 0.5;
        }

        return Math.max(Math.round(score * 10) / 10, 1);
    }

    getSleepRecommendations(): string[] {
        const recommendations: string[] = [];

        if (this.snoringDetected && this.snoringIntensity !== SnoringIntensity.NONE) {
            recommendations.push('Consider sleeping on your side to reduce snoring');
            recommendations.push('Avoid alcohol and heavy meals 3 hours before bedtime');
        }

        if (this.awakeningsCount > 3) {
            recommendations.push('Try to create a darker, quieter sleep environment');
            recommendations.push('Consider a white noise machine or earplugs');
        }

        if (this.sleepDurationHours && this.sleepDurationHours < 7) {
            recommendations.push('Aim for 7-9 hours of sleep for optimal recovery');
            recommendations.push('Try going to bed 30 minutes earlier tonight');
        }

        if (this.sleepTalkingFrequency > 5) {
            recommendations.push('High stress or anxiety may cause sleep talking');
            recommendations.push('Consider relaxation techniques before bed');
        }

        return recommendations;
    }
}