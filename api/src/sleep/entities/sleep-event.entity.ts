import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SleepTracking } from './sleep-tracking.entity';

export enum SleepEventType {
    SNORING = 'snoring',
    SLEEP_TALKING = 'sleep_talking',
    MOVEMENT = 'movement',
    BREATHING_PAUSE = 'breathing_pause',
    ENVIRONMENT_NOISE = 'environment_noise',
    SLEEP_INTERRUPTION = 'sleep_interruption',
}

export enum SleepEventIntensity {
    VERY_LOW = 'very_low',
    LOW = 'low',
    MODERATE = 'moderate',
    HIGH = 'high',
    VERY_HIGH = 'very_high',
}

@Entity('sleep_events')
@Index(['sleepTrackingId', 'eventTime'])
@Index(['eventType', 'eventTime'])
export class SleepEvent extends BaseEntity {
    @Column({ name: 'sleep_tracking_id' })
    sleepTrackingId: string;

    @Column({ name: 'event_time', type: 'timestamp with time zone' })
    eventTime: Date;

    @Column({
        name: 'event_type',
        type: 'varchar',
        length: 50,
    })
    eventType: SleepEventType;

    @Column({
        name: 'intensity',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    intensity?: SleepEventIntensity;

    @Column({ name: 'duration_seconds', nullable: true })
    durationSeconds?: number;

    @Column({ name: 'confidence_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
    confidenceScore?: number; // 0.00 - 1.00

    @Column({ name: 'audio_segment_start', nullable: true })
    audioSegmentStart?: number; // seconds from recording start

    @Column({ name: 'audio_segment_end', nullable: true })
    audioSegmentEnd?: number; // seconds from recording start

    @Column({ name: 'transcription', type: 'text', nullable: true })
    transcription?: string; // For sleep talking events

    @Column({ name: 'details', type: 'jsonb', nullable: true })
    details?: {
        frequency?: number; // Hz for snoring
        volume?: number; // dB level
        pattern?: string; // regular, irregular, etc.
        words_detected?: string[]; // for sleep talking
        movement_type?: string; // for movement events
        environmental_source?: string; // for noise events
    };

    // Relations
    @ManyToOne(() => SleepTracking, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'sleep_tracking_id' })
    sleepTracking: SleepTracking;
}