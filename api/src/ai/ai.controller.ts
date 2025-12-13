import { Body, Controller, Get, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from '../chat/chat.service';
import { AiService } from './ai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { EnterpriseChatCompletionDto } from './dto/enterprise-chat-completion.dto';

@Controller('ai')
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(
        private readonly aiService: AiService,
        private readonly chatService: ChatService,
    ) { }

    @Post('chat')
    @Public()
    async createChatCompletion(@Body() chatCompletionDto: ChatCompletionDto) {
        return this.aiService.createChatCompletion(chatCompletionDto);
    }

    @Post('chat/enterprise')
    @UseGuards(JwtAuthGuard)
    async createChatCompletionEnterprise(
        @Req() req,
        @Body() enterpriseDto: EnterpriseChatCompletionDto,
    ) {
        return this.aiService.createChatCompletionWithPersistence(
            req.user.id,
            enterpriseDto.sessionId,
            {
                model: enterpriseDto.model,
                messages: enterpriseDto.messages,
                temperature: enterpriseDto.temperature,
                max_tokens: enterpriseDto.max_tokens,
            },
        );
    }

    @Post('chat/stream')
    @Public()
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

    @Post('chat/stream/enterprise')
    @UseGuards(JwtAuthGuard)
    async streamChatCompletionEnterprise(
        @Req() req,
        @Body() enterpriseDto: EnterpriseChatCompletionDto,
        @Res() res: Response
    ) {
        try {
            console.log('🔍 Enterprise streaming DEBUG:', {
                userId: req.user?.id,
                userObject: req.user,
                sessionId: enterpriseDto.sessionId
            });

            const { sessionId } = enterpriseDto;

            const { stream, userMessage, processingStart } = await this.aiService.streamChatCompletionWithPersistence(
                req.user.id,
                sessionId,
                {
                    model: enterpriseDto.model,
                    messages: enterpriseDto.messages,
                    temperature: enterpriseDto.temperature,
                    max_tokens: enterpriseDto.max_tokens,
                    stream: true,
                },
            );

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

            let fullContent = '';
            let usage: any = null;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    res.write(chunk);

                    // Collect content for database persistence
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data !== '[DONE]') {
                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                        fullContent += content;
                                    }
                                    if (parsed.usage) {
                                        usage = parsed.usage;
                                    }
                                } catch (error) {
                                    // Ignore parsing errors
                                }
                            }
                        }
                    }
                }

                // Save assistant response to database
                const processingTime = Date.now() - processingStart;
                await this.aiService.saveStreamingResponse(
                    req.user.id,
                    enterpriseDto.sessionId,
                    fullContent,
                    enterpriseDto.model,
                    usage,
                    processingTime,
                );

            } finally {
                reader.releaseLock();
            }

            res.end();
        } catch (error) {
            this.logger.error('Enterprise streaming error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to stream chat completion' });
            }
        }
    }

    @Get('models')
    @Public()
    async getAvailableModels() {
        return this.aiService.getAvailableModels();
    }
}