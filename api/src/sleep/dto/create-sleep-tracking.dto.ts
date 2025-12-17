import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { SnoringIntensity } from '../entities/sleep-tracking.entity';

export class CreateSleepTrackingDto {
    @ApiProperty({ description: 'Sleep date (YYYY-MM-DD)' })
    @IsString()
    sleepDate: string;

    @ApiPropertyOptional({ description: 'Recording start time' })
    @IsOptional()
    @IsDateString()
    recordingStartTime?: string;

    @ApiPropertyOptional({ description: 'Recording end time' })
    @IsOptional()
    @IsDateString()
    recordingEndTime?: string;

    @ApiPropertyOptional({ description: 'Audio files metadata' })
    @IsOptional()
    @IsArray()
    audioFiles?: Array<{
        url: string;
        duration: number;
        segment: number;
        size: number;
    }>;

    @ApiPropertyOptional({ description: 'Sleep duration in hours' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(24)
    sleepDurationHours?: number;

    @ApiPropertyOptional({ description: 'Whether snoring was detected' })
    @IsOptional()
    @IsBoolean()
    snoringDetected?: boolean;

    @ApiPropertyOptional({ description: 'Snoring intensity level', enum: SnoringIntensity })
    @IsOptional()
    @IsEnum(SnoringIntensity)
    snoringIntensity?: SnoringIntensity;

    @ApiPropertyOptional({ description: 'Whether sleep talking was detected' })
    @IsOptional()
    @IsBoolean()
    sleepTalkingDetected?: boolean;

    @ApiPropertyOptional({ description: 'Sleep talking frequency (episodes)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    sleepTalkingFrequency?: number;

    @ApiPropertyOptional({ description: 'Sleep quality score (1-10)' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    sleepQualityScore?: number;

    @ApiPropertyOptional({ description: 'Number of awakenings' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    awakeningsCount?: number;

    @ApiPropertyOptional({ description: 'Sleep efficiency percentage' })
    @IsOptional()
    @IsNumber()
    sleepEfficiency?: number;

    @ApiPropertyOptional({ description: 'Analysis metadata' })
    @IsOptional()
    analysisMetadata?: {
        deepSleepPercentage?: number;
        lightSleepPercentage?: number;
        remSleepPercentage?: number;
        noiseLevel?: number;
        roomTemperature?: number;
        environmentalFactors?: string[];
        sleepEfficiency?: number;
        timeToFallAsleep?: number;
        longestAwakePeriod?: number;
        averageHeartRate?: number;
        oxygenSaturation?: number;
        fallbackMode?: boolean;
        reason?: string;
    };
}