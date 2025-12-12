import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { AuthProvider } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'securePassword123',
        minLength: 8,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password?: string;

    @ApiProperty({
        description: 'Authentication provider',
        enum: AuthProvider,
        default: AuthProvider.LOCAL,
        required: false,
    })
    @IsOptional()
    @IsEnum(AuthProvider)
    authProvider?: AuthProvider;

    @ApiProperty({
        description: 'External provider user ID',
        example: 'google_123456789',
        required: false,
    })
    @IsOptional()
    @IsString()
    externalId?: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @ApiProperty({
        description: 'Consent for voice processing',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    consentVoiceProcessing?: boolean;

    @ApiProperty({
        description: 'Consent for personalization',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    consentPersonalization?: boolean;

    @ApiProperty({
        description: 'User primary goals',
        example: ['productivity', 'wellness'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    primaryGoals?: string[];

    @ApiProperty({
        description: 'User timezone',
        example: 'Europe/Warsaw',
        required: false,
    })
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiProperty({
        description: 'User language',
        example: 'pl',
        required: false,
    })
    @IsOptional()
    @IsString()
    language?: string;
}