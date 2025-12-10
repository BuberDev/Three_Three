import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SemanticSearchJournalDto {
    @ApiProperty({ description: 'Search query for semantic search' })
    @IsString()
    query: string;

    @ApiPropertyOptional({ description: 'Maximum number of results (default: 10)', minimum: 1, maximum: 50 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number;
}