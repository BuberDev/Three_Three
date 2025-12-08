import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
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
}