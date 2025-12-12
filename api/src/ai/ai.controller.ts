import { Body, Controller, Get, Logger, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { AiService } from './ai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';

@Controller('ai')
@Public()
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async createChatCompletion(@Body() chatCompletionDto: ChatCompletionDto) {
        return this.aiService.createChatCompletion(chatCompletionDto);
    }

    @Post('chat/stream')
    async streamChatCompletion(
        @Body() chatCompletionDto: ChatCompletionDto,
        @Res() res: Response
    ) {
        try {
            const stream = await this.aiService.streamChatCompletion(chatCompletionDto);

            // Set headers for proper streaming to frontend
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            const reader = stream.body?.getReader();
            if (!reader) {
                this.logger.error('No stream reader available from OpenRouter response');
                return res.status(500).json({ error: 'No stream reader available' });
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    res.write(chunk);
                }
            } finally {
                reader.releaseLock();
            }

            res.end();
        } catch (error) {
            this.logger.error('Streaming error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to stream chat completion' });
            }
        }
    }

    @Get('models')
    async getAvailableModels() {
        return this.aiService.getAvailableModels();
    }
}