import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdateUserSettingsDto {
    @ApiProperty({
        description: 'Consent for voice processing',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    consentVoiceProcessing?: boolean;

    @ApiProperty({
        description: 'Consent for personalization',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    consentPersonalization?: boolean;

    @ApiProperty({
        description: 'User primary goals',
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    primaryGoals?: string[];

    @ApiProperty({
        description: 'User preferences object',
        type: 'object',
        required: false,
    })
    @IsOptional()
    @IsObject()
    preferences?: Record<string, any>;

    @ApiProperty({
        description: 'User timezone',
        example: 'UTC+01:00',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    timezone?: string;

    @ApiProperty({
        description: 'User language',
        example: 'en',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(5)
    language?: string;

    @ApiProperty({
        description: 'Notifications enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    notificationsEnabled?: boolean;

    @ApiProperty({
        description: 'Email notifications enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    emailNotifications?: boolean;

    @ApiProperty({
        description: 'Push notifications enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    pushNotifications?: boolean;

    @ApiProperty({
        description: 'Data processing consent',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    dataProcessingConsent?: boolean;

    @ApiProperty({
        description: 'Analytics enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    analyticsEnabled?: boolean;

    @ApiProperty({
        description: 'Share usage data',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    shareUsageData?: boolean;

    @ApiProperty({
        description: 'Allow personalization',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    allowPersonalization?: boolean;

    @ApiProperty({
        description: 'AI analysis enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    aiAnalysisEnabled?: boolean;

    @ApiProperty({
        description: 'Voice processing enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    voiceProcessingEnabled?: boolean;

    @ApiProperty({
        description: 'Sleep tracking enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    sleepTrackingEnabled?: boolean;

    @ApiProperty({
        description: 'Task reminders enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    taskRemindersEnabled?: boolean;

    @ApiProperty({
        description: 'Location tracking enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    locationTrackingEnabled?: boolean;

    @ApiProperty({
        description: 'Data retention period in days',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    dataRetentionDays?: number;

    @ApiProperty({
        description: 'Auto export enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    autoExportEnabled?: boolean;

    @ApiProperty({
        description: 'Privacy level (strict, standard, relaxed)',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    privacyLevel?: string;

    @ApiProperty({
        description: 'Performance metrics enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    performanceMetricsEnabled?: boolean;

    @ApiProperty({
        description: 'Correlation analysis enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    correlationAnalysisEnabled?: boolean;

    @ApiProperty({
        description: 'Beta features enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    betaFeaturesEnabled?: boolean;

    @ApiProperty({
        description: 'Biometric authentication enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    biometricAuthEnabled?: boolean;

    @ApiProperty({
        description: 'Session timeout enabled',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    sessionTimeoutEnabled?: boolean;

    @ApiProperty({
        description: 'Session timeout in minutes',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    sessionTimeoutMinutes?: number;
}