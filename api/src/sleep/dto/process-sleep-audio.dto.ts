import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ProcessSleepAudioDto {
    @ApiProperty({ description: 'When the recording started (ISO timestamp)' })
    @IsDateString()
    bedtime: string;

    @ApiProperty({ description: 'When the recording stopped (ISO timestamp)' })
    @IsDateString()
    wakeTime: string;
}
