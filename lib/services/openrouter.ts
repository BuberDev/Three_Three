import { ChatCompletionRequest, ChatCompletionResponse } from '../types/llm';
import { getApiUrl } from '../utils/config';

export class OpenRouterService {
    private static instance: OpenRouterService;
    private readonly apiBaseUrl: string;

    private constructor() {
        this.apiBaseUrl = getApiUrl();
    }

    public static getInstance(): OpenRouterService {
        if (!OpenRouterService.instance) {
            OpenRouterService.instance = new OpenRouterService();
        }
        return OpenRouterService.instance;
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
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Failed to get response stream');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

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
            }
        } finally {
            reader.releaseLock();
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
