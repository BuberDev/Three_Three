import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsArray,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { CreateVoiceNoteDto } from './create-voice-note.dto';

export class UpdateVoiceNoteDto extends PartialType(CreateVoiceNoteDto) {
    @ApiProperty({
        description: 'Updated transcription text',
        required: false,
    })
    @IsOptional()
    @IsString()
    transcription?: string;

    @ApiProperty({
        description: 'Updated summary text',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    summary?: string;

    @ApiProperty({
        description: 'Additional tags to add',
        example: ['important', 'follow-up'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    additionalTags?: string[];
}