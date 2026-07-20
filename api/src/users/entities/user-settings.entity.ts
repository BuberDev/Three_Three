import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ default: false })
    consentVoiceProcessing: boolean;

    @Column({ default: false })
    consentPersonalization: boolean;

    @Column({ type: 'jsonb', default: [] })
    primaryGoals: string[];

    @Column({ type: 'jsonb', default: {} })
    preferences: Record<string, any>;

    @Column({ nullable: true, length: 50 })
    timezone?: string;

    @Column({ nullable: true, length: 5 })
    language?: string;

    @Column({ default: true })
    notificationsEnabled: boolean;

    @Column({ default: true })
    emailNotifications: boolean;

    @Column({ default: false })
    pushNotifications: boolean;

    // Privacy & Security Settings
    @Column({ default: true })
    dataProcessingConsent: boolean;

    @Column({ default: true })
    analyticsEnabled: boolean;

    @Column({ default: false })
    shareUsageData: boolean;

    @Column({ default: true })
    allowPersonalization: boolean;

    // Feature Settings
    @Column({ default: true })
    aiAnalysisEnabled: boolean;

    @Column({ default: true })
    voiceProcessingEnabled: boolean;

    @Column({ default: false })
    sleepTrackingEnabled: boolean;

    @Column({ default: true })
    taskRemindersEnabled: boolean;

    @Column({ default: false })
    locationTrackingEnabled: boolean;

    // Data & Export Settings
    @Column({ default: 365 })
    dataRetentionDays: number;

    @Column({ default: false })
    autoExportEnabled: boolean;

    @Column({ type: 'varchar', length: 20, default: 'standard' })
    privacyLevel: string; // 'strict', 'standard', 'relaxed'

    // Performance & Analytics
    @Column({ default: true })
    performanceMetricsEnabled: boolean;

    @Column({ default: true })
    correlationAnalysisEnabled: boolean;

    @Column({ default: false })
    betaFeaturesEnabled: boolean;

    // Security Settings
    @Column({ default: false })
    biometricAuthEnabled: boolean;

    @Column({ default: true })
    sessionTimeoutEnabled: boolean;

    @Column({ default: 30 })
    sessionTimeoutMinutes: number;

    // Relations
    @OneToOne(() => User, (user) => user.settings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
}