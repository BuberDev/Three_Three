import { useCallback, useState } from 'react';
import { ChatSession } from '../components/ai/chat-session-manager';
import { ChatMessage } from '../components/ai/enterprise-chat-interface';

interface AIChatState {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
}

export const useAIChat = () => {
    const [state, setState] = useState<AIChatState>({
        sessions: [],
        currentSession: null,
        messages: [],
        isLoading: false,
        error: null,
    });

    const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

    const createSession = useCallback((title: string, type: ChatSession['type']) => {
        const newSession: ChatSession = {
            id: generateId(),
            title,
            type,
            lastMessage: 'Konwersacja utworzona',
            timestamp: new Date(),
            messageCount: 0,
        };

        setState(prev => ({
            ...prev,
            sessions: [newSession, ...prev.sessions],
            currentSession: newSession,
            messages: [],
        }));

        return newSession;
    }, []);

    const selectSession = useCallback((session: ChatSession | null) => {
        setState(prev => ({
            ...prev,
            currentSession: session,
            messages: [], // In real app, load messages from storage
        }));
    }, []);

    const deleteSession = useCallback((sessionId: string) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.filter(s => s.id !== sessionId),
            currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession,
            messages: prev.currentSession?.id === sessionId ? [] : prev.messages,
        }));
    }, []);

    const sendMessage = useCallback(async (content: string): Promise<void> => {
        if (!state.currentSession) {
            // Create a default session if none exists
            createSession('Nowa konwersacja', 'general');
        }

        const userMessage: ChatMessage = {
            id: generateId(),
            content,
            role: 'user',
            timestamp: new Date(),
        };

        // Add user message
        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            isLoading: true,
            error: null,
        }));

        try {
            // Add typing indicator
            const typingMessage: ChatMessage = {
                id: generateId(),
                content: '',
                role: 'assistant',
                timestamp: new Date(),
                isTyping: true,
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, typingMessage],
            }));

            // Simulate AI response (replace with real API call)
            const response = await simulateAIResponse(content);

            // Remove typing indicator and add real response
            setState(prev => {
                const messagesWithoutTyping = prev.messages.filter(m => !m.isTyping);
                const aiMessage: ChatMessage = {
                    id: generateId(),
                    content: response.content,
                    role: 'assistant',
                    timestamp: new Date(),
                    tokens: response.tokens,
                };

                // Update session with last message
                const updatedSessions = prev.sessions.map(session =>
                    session.id === prev.currentSession?.id
                        ? {
                            ...session,
                            lastMessage: response.content.substring(0, 100) + '...',
                            timestamp: new Date(),
                            messageCount: session.messageCount + 2, // user + ai
                        }
                        : session
                );

                return {
                    ...prev,
                    messages: [...messagesWithoutTyping, aiMessage],
                    sessions: updatedSessions,
                    isLoading: false,
                };
            });

        } catch (error) {
            setState(prev => ({
                ...prev,
                messages: prev.messages.filter(m => !m.isTyping),
                isLoading: false,
                error: error instanceof Error ? error.message : 'Wystąpił błąd',
            }));
        }
    }, [state.currentSession, createSession]);

    const newSession = useCallback(() => {
        const session = createSession('Nowa konwersacja', 'general');
        return session;
    }, [createSession]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        sessions: state.sessions,
        currentSession: state.currentSession,
        messages: state.messages,
        isLoading: state.isLoading,
        error: state.error,
        sendMessage,
        createSession,
        selectSession,
        deleteSession,
        newSession,
        clearError,
    };
};

// Simulate AI response (replace with real API integration)
const simulateAIResponse = async (userMessage: string): Promise<{ content: string; tokens: number }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
        {
            content: `Dziękuję za pytanie! Analizuję Twoją wiadomość: "${userMessage.substring(0, 50)}..."\n\nOto moja odpowiedź:\n\n• Rozumiem kontekst Twojego zapytania\n• Mogę pomóc z implementacją rozwiązania\n• Zaproponuję najlepsze praktyki Enterprise\n\nCzy chcesz abyśmy przeszli do szczegółów?`,
            tokens: Math.floor(Math.random() * 150) + 50
        },
        {
            content: `Świetne pytanie! W kontekście Enterprise development, ważne jest żeby:\n\n1. **Architektura**: Zapewnić skalowalność rozwiązania\n2. **Bezpieczeństwo**: Implementować proper authentication\n3. **Performance**: Optymalizować dla production load\n4. **Monitoring**: Dodać comprehensive logging\n\nJakie konkretne aspekty Cię interesują?`,
            tokens: Math.floor(Math.random() * 200) + 75
        },
        {
            content: `Na podstawie Twojego zapytania, oto profesjonalne rozwiązanie:\n\n\`\`\`typescript\n// Enterprise-grade implementation\nclass ${getRandomClassName()}Service {\n  async processData(input: string): Promise<Result> {\n    try {\n      // Implementation here\n      return { success: true, data: processedData };\n    } catch (error) {\n      logger.error('Processing failed:', error);\n      throw new ServiceError('Data processing failed');\n    }\n  }\n}\n\`\`\`\n\nCzy to rozwiązanie odpowiada Twoim potrzebom?`,
            tokens: Math.floor(Math.random() * 250) + 100
        }
    ];

    return responses[Math.floor(Math.random() * responses.length)];
};

const getRandomClassName = (): string => {
    const names = ['Data', 'User', 'Analytics', 'Enterprise', 'Business', 'Service', 'Manager'];
    return names[Math.floor(Math.random() * names.length)];
};