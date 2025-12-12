import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class Message {
    @IsString()
    @IsIn(['system', 'user', 'assistant'])
    role: 'system' | 'user' | 'assistant';

    @IsString()
    content: string;
}

export class ChatCompletionDto {
    @IsString()
    model: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Message)
    messages: Message[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(2)
    temperature?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    max_tokens?: number;

    @IsOptional()
    @IsBoolean()
    stream?: boolean;
}