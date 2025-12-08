import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateVoiceNoteDto {
    @ApiProperty({
        description: 'Optional title for the voice note',
        example: 'Meeting Notes - Q4 Planning',
        maxLength: 500,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    title?: string;

    @ApiProperty({
        description: 'Optional tags for categorization',
        example: ['work', 'meeting', 'planning'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({
        description: 'Optional metadata object',
        example: { location: 'office', participants: ['John', 'Jane'] },
        required: false,
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}