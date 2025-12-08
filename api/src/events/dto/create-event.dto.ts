import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
    @ApiProperty({
        description: 'Event type',
        enum: EventType,
    })
    type: EventType;

    @ApiProperty({
        description: 'User ID associated with the event',
        required: false,
    })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiProperty({
        description: 'Event payload data',
    })
    payload: Record<string, any>;

    @ApiProperty({
        description: 'Event metadata',
        required: false,
    })
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiProperty({
        description: 'Correlation ID for tracking related events',
        required: false,
    })
    @IsOptional()
    @IsString()
    correlationId?: string;

    @ApiProperty({
        description: 'Source service that generated the event',
        required: false,
    })
    @IsOptional()
    @IsString()
    sourceService?: string;
}