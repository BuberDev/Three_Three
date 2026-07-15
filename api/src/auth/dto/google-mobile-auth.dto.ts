import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class GoogleMobileAuthDto {
    @ApiProperty({
        description: 'Google ID token returned by the native mobile Google sign-in flow',
    })
    @IsString()
    idToken: string;

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
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    primaryGoals?: string[];

    @ApiProperty({
        description: 'User timezone',
        required: false,
    })
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiProperty({
        description: 'User language',
        required: false,
    })
    @IsOptional()
    @IsString()
    language?: string;
}
