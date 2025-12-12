import { ChatCompletionRequest, ChatCompletionResponse } from '../types/llm';

export class AIService {
    private static instance: AIService;
    private readonly apiBaseUrl: string;

    private constructor() {
        this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const response = await fetch(`${this.apiBaseUrl}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...request,
                temperature: request.temperature || 0.7,
                max_tokens: request.max_tokens || 4000,
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI Chat error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return await response.json();
    }

    public async streamChatCompletion(
        request: ChatCompletionRequest,
        onChunk: (chunk: string) => void,
        onComplete: (usage: any) => void
    ): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/api/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...request,
                stream: true,
                temperature: request.temperature || 0.7,
                max_tokens: request.max_tokens || 4000,
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI Chat error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        // React Native doesn't support streaming responses like web browsers
        // For now, let's fall back to the non-streaming endpoint
        console.log('Using non-streaming fallback due to React Native limitations');

        try {
            // Read the complete response as text
            const text = await response.text();

            // Process the complete response and call onChunk for each piece
            const lines = text.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            onChunk(content);
                        }

                        if (parsed.usage) {
                            onComplete(parsed.usage);
                        }
                    } catch (error) {
                        console.warn('Failed to parse streaming JSON chunk:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            throw new Error('Failed to process streaming response');
        }
    }

    public async getAvailableModels(): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/models`);

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Failed to fetch available models:', error);
            return [];
        }
    }
}