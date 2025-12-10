import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ActivityType, MoodLevel } from '../entities/daily-activity.entity';

export class CreateDailyActivityDto {
    @ApiProperty({ description: 'Type of activity', enum: ActivityType })
    @IsEnum(ActivityType)
    activityType: ActivityType;

    @ApiProperty({ description: 'Activity title' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'Activity description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Duration in minutes' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    durationMinutes?: number;

    @ApiPropertyOptional({ description: 'Location where activity took place' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'People involved in activity' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    peopleInvolved?: string[];

    @ApiPropertyOptional({ description: 'Mood before activity', enum: MoodLevel })
    @IsOptional()
    @IsEnum(MoodLevel)
    moodBefore?: MoodLevel;

    @ApiPropertyOptional({ description: 'Mood after activity', enum: MoodLevel })
    @IsOptional()
    @IsEnum(MoodLevel)
    moodAfter?: MoodLevel;

    @ApiPropertyOptional({ description: 'Energy level (1-10)' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    energyLevel?: number;

    @ApiPropertyOptional({ description: 'Productivity rating (1-10)' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    productivityRating?: number;

    @ApiPropertyOptional({ description: 'Tags associated with activity' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}