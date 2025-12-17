import { ChatCompletionResponse } from '../types/llm';
import { apiService } from './api';

/**
 * Enterprise AI Service with database persistence
 * Uses /api/chat/* endpoints instead of /api/ai/* for full database integration
 */
export class EnterpriseAIService {
    private static instance: EnterpriseAIService;
    private readonly apiBaseUrl: string;

    private constructor() {
        this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    }

    public static getInstance(): EnterpriseAIService {
        if (!EnterpriseAIService.instance) {
            EnterpriseAIService.instance = new EnterpriseAIService();
        }
        return EnterpriseAIService.instance;
    }

    /**
     * Create a new chat session
     */
    public async createSession(title: string, type: 'general' | 'task_assistance' | 'analytics' | 'personal' | 'voice_analysis' = 'general'): Promise<{ id: string; title: string; type: string; createdAt: string }> {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
            body: JSON.stringify({
                title,
                type,
                model: 'tngtech/deepseek-r1t2-chimera:free',
                settings: {
                    temperature: 0.7,
                    max_tokens: 4000,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Create session error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const sessionData = await response.json();
        console.log('🔍 Enterprise AI createSession response:', sessionData);
        return sessionData.data || sessionData;
    }

    /**
     * Get user's chat sessions
     */
    public async getSessions(): Promise<any[]> {
        console.log('🔍 Enterprise AI getSessions called');

        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('🚨 getSessions error:', response.status, errorData);
            throw new Error(`Get sessions error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 getSessions response:', data);

        // Extract sessions array from nested response structure
        const sessions = data.data?.data || data.data || data.sessions || data || [];
        console.log('🔍 getSessions extracted sessions:', sessions);

        return sessions;
    }

    /**
     * Get messages for a specific session
     */
    public async getSessionMessages(sessionId: string): Promise<any[]> {
        console.log('🔍 Enterprise AI getSessionMessages called for session:', sessionId);

        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${sessionId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('🚨 getSessionMessages error:', response.status, errorData);
            throw new Error(`Get messages error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 getSessionMessages response:', data);

        // Handle nested response structure
        const messages = data.data?.data || data.data || data.messages || data || [];
        console.log('🔍 getSessionMessages extracted messages:', messages);

        return messages;
    }

    /**
     * Enterprise chat completion with database persistence
     */
    public async createChatCompletion(sessionId: string, message: string, messages: any[]): Promise<ChatCompletionResponse> {
        const response = await fetch(`${this.apiBaseUrl}/api/ai/chat/enterprise`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
            body: JSON.stringify({
                model: 'tngtech/deepseek-r1t2-chimera:free',
                sessionId,
                message,
                messages,
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI Chat error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Enterprise streaming chat completion with database persistence
     */
    public async streamChatCompletion(
        sessionId: string,
        message: string,
        messages: any[],
        onChunk: (chunk: string) => void,
        onComplete: (usage: any) => void
    ): Promise<void> {
        // DEBUG: Log request payload
        const requestPayload = {
            model: 'tngtech/deepseek-r1t2-chimera:free',
            sessionId,
            message,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4000,
        };

        console.log('🔍 Enterprise AI streamChatCompletion DEBUG:', {
            sessionId,
            sessionIdType: typeof sessionId,
            sessionIdLength: sessionId?.length,
            requestPayload,
        });

        const response = await fetch(`${this.apiBaseUrl}/api/ai/chat/stream/enterprise`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
            body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI Stream error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        // Process streaming response
        try {
            // For React Native, we need to read the complete response
            const text = await response.text();
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
            console.error('Enterprise streaming error:', error);
            throw new Error('Failed to process enterprise streaming response');
        }
    }

    /**
     * Update session (title, settings)
     */
    public async updateSession(sessionId: string, updates: { title?: string; settings?: any }): Promise<any> {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Update session error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Archive session
     */
    public async archiveSession(sessionId: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${sessionId}/archive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Archive session error: ${response.status} - ${errorData.message || response.statusText}`);
        }
    }

    /**
     * Delete session
     */
    public async deleteSession(sessionId: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Delete session error: ${response.status} - ${errorData.message || response.statusText}`);
        }
    }

    /**
     * Get chat statistics
     */
    public async getChatStats(): Promise<any> {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Get stats error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return await response.json();
    }
}

// Export singleton instance
export const enterpriseAI = EnterpriseAIService.getInstance();