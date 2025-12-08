import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class SemanticSearchDto {
    @ApiProperty({
        description: 'Search query for semantic similarity',
        example: 'project planning and team coordination',
    })
    @IsString()
    query: string;

    @ApiProperty({
        description: 'Number of similar results to return',
        example: 10,
        default: 10,
        minimum: 1,
        maximum: 50,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number;

    @ApiProperty({
        description: 'Minimum similarity threshold (0.0 to 1.0)',
        example: 0.7,
        default: 0.5,
        minimum: 0.0,
        maximum: 1.0,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0.0)
    @Max(1.0)
    threshold?: number;
}