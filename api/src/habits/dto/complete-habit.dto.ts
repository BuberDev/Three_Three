import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CompleteHabitDto {
    @ApiProperty({
        description: 'Date of completion (YYYY-MM-DD format)',
        example: '2024-12-20',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    completedAt?: string;

    @ApiProperty({
        description: 'Optional notes about this completion',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        description: 'Satisfaction rating (1-5)',
        minimum: 1,
        maximum: 5,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiProperty({
        description: 'Additional metadata for this completion',
        required: false,
    })
    @IsOptional()
    metadata?: Record<string, any>;
}