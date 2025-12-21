import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { HabitCategory, HabitFrequency, HabitStatus } from '../entities/habit.entity';

export class GetHabitsDto {
    @ApiProperty({
        enum: HabitStatus,
        description: 'Filter by habit status',
        required: false,
    })
    @IsOptional()
    @IsEnum(HabitStatus)
    status?: HabitStatus;

    @ApiProperty({
        enum: HabitCategory,
        description: 'Filter by habit category',
        required: false,
    })
    @IsOptional()
    @IsEnum(HabitCategory)
    category?: HabitCategory;

    @ApiProperty({
        enum: HabitFrequency,
        description: 'Filter by habit frequency',
        required: false,
    })
    @IsOptional()
    @IsEnum(HabitFrequency)
    frequency?: HabitFrequency;

    @ApiProperty({
        description: 'Page number for pagination',
        minimum: 1,
        default: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 50,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number = 50;
}

export class GetHabitStatsDto {
    @ApiProperty({
        description: 'Start date for statistics (YYYY-MM-DD)',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({
        description: 'End date for statistics (YYYY-MM-DD)',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}