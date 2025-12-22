import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat/chat.service';
import { MessageRole } from '../chat/entities/chat-message.entity';
import { ChatCompletionDto } from './dto/chat-completion.dto';

interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly openRouterApiKey: string;
    private readonly openRouterBaseUrl = 'https://openrouter.ai/api/v1';

    constructor(
        private configService: ConfigService,
        private chatService: ChatService,
    ) {
        this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');

        if (!this.openRouterApiKey) {
            this.logger.warn('OPENROUTER_API_KEY not configured. AI chat will not work.');
        }
    }

    async createChatCompletion(request: ChatCompletionDto): Promise<OpenRouterResponse> {
        if (!this.openRouterApiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        try {
            const response = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://three-three-app.local',
                    'X-Title': 'Three Three AI Assistant'
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: request.messages,
                    temperature: request.temperature || 0.7,
                    max_tokens: request.max_tokens || 4000,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.logger.error(`OpenRouter API error: ${response.status}`, errorData);
                throw new Error(`AI service error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error('Failed to create chat completion', error);
            throw new Error('Failed to process AI request');
        }
    }

    async streamChatCompletion(request: ChatCompletionDto) {
        if (!this.openRouterApiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        try {
            const requestBody = {
                model: request.model,
                messages: request.messages,
                temperature: request.temperature || 0.7,
                max_tokens: request.max_tokens || 4000,
                stream: true,
            };

            this.logger.debug('OpenRouter request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://three-three-app.local',
                    'X-Title': 'Three Three AI Assistant'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.logger.error(`OpenRouter API error: ${response.status}`, errorData);
                throw new Error(`AI service error: ${response.status}`);
            }

            this.logger.debug('OpenRouter response headers:', Object.fromEntries(response.headers.entries()));
            this.logger.debug('OpenRouter response body type:', typeof response.body);
            this.logger.debug('OpenRouter response body readable:', response.body ? 'yes' : 'no');

            return response;
        } catch (error) {
            this.logger.error('Failed to create streaming chat completion', error);
            throw new Error('Failed to process AI streaming request');
        }
    }

    async getAvailableModels() {
        if (!this.openRouterApiKey) {
            return { models: [] };
        }

        try {
            const response = await fetch(`${this.openRouterBaseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`
                }
            });

            if (!response.ok) {
                this.logger.error(`Failed to fetch models: ${response.status}`);
                return { models: [] };
            }

            const data = await response.json();
            return { models: data.data || [] };
        } catch (error) {
            this.logger.error('Failed to fetch available models', error);
            return { models: [] };
        }
    }

    /**
     * Enterprise method: Create chat completion with database persistence
     */
    async createChatCompletionWithPersistence(
        userId: string,
        sessionId: string,
        request: ChatCompletionDto,
    ): Promise<any> {
        const startTime = Date.now();

        try {
            // Save user message to database
            const userMessage = await this.chatService.addStreamingMessage(
                userId,
                sessionId,
                MessageRole.USER,
                request.messages[request.messages.length - 1].content,
                request.model,
            );

            // Get AI response
            const response = await this.createChatCompletion(request);
            const processingTime = Date.now() - startTime;

            // Save assistant response to database
            const assistantMessage = await this.chatService.addStreamingMessage(
                userId,
                sessionId,
                MessageRole.ASSISTANT,
                response.choices[0].message.content,
                request.model,
                response.usage,
                processingTime,
            );

            return {
                ...response,
                userMessage,
                assistantMessage,
            };
        } catch (error) {
            this.logger.error('Failed to create chat completion with persistence', error);
            throw error;
        }
    }

    /**
     * Enterprise method: Stream chat completion with database persistence
     */
    async streamChatCompletionWithPersistence(
        userId: string,
        sessionId: string,
        request: ChatCompletionDto,
    ): Promise<{
        stream: Response;
        userMessage: any;
        processingStart: number;
    }> {
        const startTime = Date.now();

        try {
            // Save user message to database immediately
            const userMessage = await this.chatService.addStreamingMessage(
                userId,
                sessionId,
                MessageRole.USER,
                request.messages[request.messages.length - 1].content,
                request.model,
            );

            // Get streaming response from OpenRouter
            const stream = await this.streamChatCompletion(request);

            return {
                stream,
                userMessage,
                processingStart: startTime,
            };
        } catch (error) {
            this.logger.error('Failed to start streaming chat completion with persistence', error);
            throw error;
        }
    }

    /**
     * Enterprise method: Save assistant response after streaming completes
     */
    async saveStreamingResponse(
        userId: string,
        sessionId: string,
        content: string,
        model: string,
        usage: any,
        processingTimeMs: number,
    ): Promise<any> {
        try {
            return await this.chatService.addStreamingMessage(
                userId,
                sessionId,
                MessageRole.ASSISTANT,
                content,
                model,
                usage,
                processingTimeMs,
            );
        } catch (error) {
            this.logger.error('Failed to save streaming response', error);
            throw error;
        }
    }

    /**
     * Convert speech to text - placeholder implementation
     */
    async speechToText(audioBuffer: Buffer, filename: string): Promise<{ transcription: string; confidence?: number }> {
        this.logger.log(`Audio received: ${filename} (${audioBuffer.length} bytes)`);

        // Return empty transcription - real speech-to-text would go here
        return {
            transcription: '',
            confidence: 0.0,
        };
    }
}