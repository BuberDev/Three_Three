import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ChatSessionType } from '../entities/chat-session.entity';

export class CreateChatSessionDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsEnum(ChatSessionType)
    @IsOptional()
    type?: ChatSessionType = ChatSessionType.GENERAL;

    @IsString()
    @IsOptional()
    model?: string = 'tngtech/deepseek-r1t2-chimera:free';

    @IsString()
    @IsOptional()
    systemPrompt?: string;

    @IsObject()
    @IsOptional()
    settings?: Record<string, any>;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateChatSessionDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    systemPrompt?: string;

    @IsObject()
    @IsOptional()
    settings?: Record<string, any>;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}