import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateJournalEntryDto {
    @ApiProperty({ description: 'Journal entry content' })
    @IsString()
    content: string;

    @ApiPropertyOptional({ description: 'Voice transcription if created from audio' })
    @IsOptional()
    @IsString()
    transcription?: string;

    @ApiPropertyOptional({ description: 'Sentiment score (-1 to 1)' })
    @IsOptional()
    @IsNumber()
    @Min(-1)
    @Max(1)
    sentimentScore?: number;

    @ApiPropertyOptional({ description: 'Emotional state as object' })
    @IsOptional()
    emotionalState?: {
        primaryEmotion?: string;
        intensity?: number;
        secondaryEmotions?: string[];
        emotionalJourney?: Array<{
            time: string;
            emotion: string;
            intensity: number;
        }>;
    };

    @ApiPropertyOptional({ description: 'URL to audio file if applicable' })
    @IsOptional()
    @IsString()
    audioFileUrl?: string;

    @ApiPropertyOptional({ description: 'Vector embedding for semantic search' })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    contentVector?: number[];

    @ApiPropertyOptional({ description: 'Tags associated with entry' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({ description: 'AI-generated insights' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    insights?: string[];
}