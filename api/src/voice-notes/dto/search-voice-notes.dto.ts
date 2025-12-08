import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { ProcessingStatus } from '../entities/voice-note.entity';

export class SearchVoiceNotesDto {
    @ApiProperty({
        description: 'Search query for title, transcription, and summary',
        example: 'meeting notes project alpha',
        required: false,
    })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiProperty({
        description: 'Filter by tags',
        example: ['work', 'meeting'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({
        description: 'Filter from date (ISO string)',
        example: '2024-01-01T00:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({
        description: 'Filter to date (ISO string)',
        example: '2024-12-31T23:59:59Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiProperty({
        description: 'Filter by processing status',
        enum: ProcessingStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(ProcessingStatus)
    processingStatus?: ProcessingStatus;

    @ApiProperty({
        description: 'Number of results to return',
        example: 20,
        default: 50,
        minimum: 1,
        maximum: 100,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number;

    @ApiProperty({
        description: 'Number of results to skip',
        example: 0,
        default: 0,
        minimum: 0,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => parseInt(value, 10))
    offset?: number;
}