import { IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MessageRole } from '../entities/chat-message.entity';

export class CreateChatMessageDto {
    @IsUUID()
    sessionId: string;

    @IsEnum(MessageRole)
    role: MessageRole;

    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateChatMessageDto {
    @IsString()
    @IsOptional()
    content?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    tokenCount?: number;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @IsNumber()
    @IsOptional()
    processingTimeMs?: number;

    @IsObject()
    @IsOptional()
    usage?: Record<string, any>;

    @IsString()
    @IsOptional()
    errorMessage?: string;
}