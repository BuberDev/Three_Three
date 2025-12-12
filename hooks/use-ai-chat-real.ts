import { useCallback, useState } from 'react';
import { ChatSession } from '../components/ai/chat-session-manager';
import { ChatMessage } from '../components/ai/enterprise-chat-interface';
import { AIService } from '../lib/services/ai-service';
import { AVAILABLE_MODELS, LLMModel } from '../lib/types/llm';

interface AIChatState {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    selectedModel: LLMModel;
    systemInstruction: string;
}

const DEFAULT_SYSTEM_INSTRUCTION = `Jesteś pomocnym AI asystentem. Odpowiadaj w języku polskim, chyba że użytkownik poprosi o inny język.

Zasady:
- Bądź precyzyjny i pomocny
- Gdy nie wiesz, powiedz to wprost
- Udzielaj praktycznych rad
- Formatuj kod w blokach markdown
- Używaj emoji oszczędnie i tylko gdy dodają wartość

Twoja rola to pomoc użytkownikowi w rozwiązywaniu problemów i udzielaniu informacji.`;

export const useAIChat = () => {
    const [state, setState] = useState<AIChatState>({
        sessions: [],
        currentSession: null,
        messages: [],
        isLoading: false,
        error: null,
        selectedModel: AVAILABLE_MODELS[0], // Claude 3.5 Sonnet jako domyślny
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
    });

    const aiService = AIService.getInstance();

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
            messages: [], // W prawdziwej aplikacji załaduj wiadomości z storage
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

    const setSelectedModel = useCallback((model: LLMModel) => {
        setState(prev => ({ ...prev, selectedModel: model }));
    }, []);

    const setSystemInstruction = useCallback((instruction: string) => {
        setState(prev => ({ ...prev, systemInstruction: instruction }));
    }, []);

    const sendMessage = useCallback(async (content: string): Promise<void> => {
        if (!state.currentSession) {
            createSession('Nowa konwersacja', 'general');
        }

        const userMessage: ChatMessage = {
            id: generateId(),
            content,
            role: 'user',
            timestamp: new Date(),
        };

        // Dodaj wiadomość użytkownika
        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            isLoading: true,
            error: null,
        }));

        try {
            // Przygotuj wiadomości dla API
            const apiMessages = [
                {
                    role: 'system' as const,
                    content: state.systemInstruction
                },
                ...state.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user' as const,
                    content
                }
            ];

            // Utwórz tymczasową wiadomość AI z typingiem
            const tempAiMessage: ChatMessage = {
                id: generateId(),
                content: '',
                role: 'assistant',
                timestamp: new Date(),
                isTyping: true,
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, tempAiMessage],
            }));

            let fullResponse = '';
            let tokenCount = 0;

            // Użyj streaming dla lepszego UX
            await aiService.streamChatCompletion(
                {
                    model: state.selectedModel.id,
                    messages: apiMessages,
                    temperature: 0.7,
                    max_tokens: 4000,
                },
                (chunk: string) => {
                    fullResponse += chunk;

                    // Aktualizuj wiadomość w czasie rzeczywistym
                    setState(prev => ({
                        ...prev,
                        messages: prev.messages.map(msg =>
                            msg.id === tempAiMessage.id
                                ? { ...msg, content: fullResponse, isTyping: true }
                                : msg
                        ),
                    }));
                },
                (usage: any) => {
                    tokenCount = usage.total_tokens || 0;
                }
            );

            // Finalizuj wiadomość
            const finalAiMessage: ChatMessage = {
                id: tempAiMessage.id,
                content: fullResponse,
                role: 'assistant',
                timestamp: new Date(),
                tokens: tokenCount,
                isTyping: false,
            };

            setState(prev => {
                const updatedMessages = prev.messages.map(msg =>
                    msg.id === tempAiMessage.id ? finalAiMessage : msg
                );

                // Aktualizuj sesję
                const updatedSessions = prev.sessions.map(session =>
                    session.id === prev.currentSession?.id
                        ? {
                            ...session,
                            lastMessage: fullResponse.substring(0, 100) + '...',
                            timestamp: new Date(),
                            messageCount: session.messageCount + 2, // user + ai
                        }
                        : session
                );

                return {
                    ...prev,
                    messages: updatedMessages,
                    sessions: updatedSessions,
                    isLoading: false,
                };
            });

        } catch (error) {
            console.error('AI Chat error:', error);

            // Usuń tymczasową wiadomość i pokaż błąd
            setState(prev => ({
                ...prev,
                messages: prev.messages.filter(m => !m.isTyping),
                isLoading: false,
                error: error instanceof Error ? error.message : 'Wystąpił błąd podczas komunikacji z AI',
            }));
        }
    }, [state.currentSession, state.messages, state.selectedModel, state.systemInstruction, createSession, aiService]);

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
        selectedModel: state.selectedModel,
        systemInstruction: state.systemInstruction,
        availableModels: AVAILABLE_MODELS,
        sendMessage,
        createSession,
        selectSession,
        deleteSession,
        setSelectedModel,
        setSystemInstruction,
        newSession,
        clearError,
    };
};