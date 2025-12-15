import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({
        description: 'Whether user email is verified',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isEmailVerified?: boolean;

    @ApiProperty({
        description: 'Whether user account is active',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'Whether user completed onboarding',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isOnboardingCompleted?: boolean;

    @ApiProperty({
        description: 'User metadata object',
        required: false,
    })
    @IsOptional()
    @IsObject()
    metadata?: {
        onboardingCompleted?: boolean;
        lastLoginAt?: string;
        stripeCustomerId?: string;
        deviceInfo?: {
            platform?: string;
            version?: string;
        };
        analyticsConsent?: boolean;
        dataExportRequests?: Array<{
            requestedAt: string;
            status: 'pending' | 'processing' | 'completed';
            downloadUrl?: string;
        }>;
    };
}