import { ApiProperty } from '@nestjs/swagger';
import {
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
}