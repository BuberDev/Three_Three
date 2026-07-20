import { useCallback, useEffect, useState } from 'react';
import { ChatSession } from '../components/ai/chat-session-manager';
import { ChatMessage } from '../components/ai/enterprise-chat-interface';
import { EnterpriseAIService } from '../lib/services/enterprise-ai';
import { AVAILABLE_MODELS, LLMModel } from '../lib/types/llm';

interface EnterpriseAIChatState {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    selectedModel: LLMModel;
    systemInstruction: string;
    isLoadingSessions: boolean;
    isLoadingMessages: boolean;
}

const DEFAULT_SYSTEM_INSTRUCTION = `Jesteś pomocnym AI asystentem. Odpowiadaj w języku polskim, chyba że użytkownik poprosi o inny język.

Zasady:
- Bądź precyzyjny i pomocny
- Gdy nie wiesz, powiedz to wprost
- Udzielaj praktycznych rad
- Formatuj kod w blokach markdown
- Używaj emoji oszczędnie i tylko gdy dodają wartość

Twoja rola to pomoc użytkownikowi w rozwiązywaniu problemów i udzielaniu informacji.`;

export const useEnterpriseAIChat = () => {
    const [state, setState] = useState<EnterpriseAIChatState>({
        sessions: [],
        currentSession: null,
        messages: [],
        isLoading: false,
        error: null,
        selectedModel: AVAILABLE_MODELS[0], // Claude 3.5 Sonnet jako domyślny
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        isLoadingSessions: false,
        isLoadingMessages: false,
    });

    const aiService = EnterpriseAIService.getInstance();

    const loadSessions = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingSessions: true, error: null }));

        try {
            console.log('🔍 Hook loadSessions called');
            const sessions = await aiService.getSessions();
            console.log('🔍 Hook loadSessions received:', sessions);

            const mappedSessions: ChatSession[] = sessions.map(session => ({
                id: session.id,
                title: session.title,
                type: session.type as ChatSession['type'],
                lastMessage: session.messageCount > 0 ? `${session.messageCount} wiadomości` : 'Brak wiadomości',
                timestamp: new Date(session.lastMessageAt || session.createdAt),
                messageCount: session.messageCount,
            }));

            console.log('🔍 Hook loadSessions mapped:', mappedSessions);

            setState(prev => ({
                ...prev,
                sessions: mappedSessions,
                isLoadingSessions: false,
            }));
        } catch (error) {
            console.log('🚨 Hook loadSessions error:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to load sessions',
                isLoadingSessions: false,
            }));
        }
    }, [aiService]);

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const createSession = useCallback(async (title: string, type: ChatSession['type']) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const newSession = await aiService.createSession(title, type as any);
            console.log('🔍 Hook createSession response:', newSession);

            // Extract session data from nested response structure
            const sessionData = (newSession as any).data || newSession;

            const mappedSession: ChatSession = {
                id: sessionData.id,
                title: sessionData.title,
                type: sessionData.type as ChatSession['type'],
                lastMessage: 'Konwersacja utworzona',
                timestamp: new Date(sessionData.createdAt),
                messageCount: 0, // Default to 0 for new sessions
            };
            console.log('🔍 Hook mappedSession:', mappedSession);

            setState(prev => ({
                ...prev,
                sessions: [mappedSession, ...prev.sessions],
                currentSession: mappedSession,
                messages: [],
                isLoading: false,
            }));

            return mappedSession;
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to create session',
                isLoading: false,
            }));
            throw error;
        }
    }, [aiService]);

    const selectSession = useCallback(async (session: ChatSession | null) => {
        // Handle null session (deselect current session)
        if (session === null) {
            setState(prev => ({
                ...prev,
                currentSession: null,
                messages: [],
                isLoadingMessages: false,
                error: null
            }));
            return;
        }

        if (session.id === state.currentSession?.id) {
            return; // Already selected
        }

        setState(prev => ({ ...prev, isLoadingMessages: true, error: null }));

        try {
            console.log('🔍 selectSession DEBUG: Loading messages for session:', session.id);
            const messages = await aiService.getSessionMessages(session.id);
            console.log('🔍 selectSession DEBUG: Received messages:', messages);

            const mappedMessages: ChatMessage[] = messages
                .filter(msg => msg.role !== 'system') // Filter out system messages
                .map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role as 'user' | 'assistant',
                    timestamp: new Date(msg.createdAt),
                    isTyping: false,
                }));

            console.log('🔍 selectSession DEBUG: Mapped messages:', mappedMessages);

            setState(prev => ({
                ...prev,
                currentSession: session,
                messages: mappedMessages,
                isLoadingMessages: false,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to load messages',
                isLoadingMessages: false,
            }));
        }
    }, [aiService, state.currentSession?.id]);

    const sendMessage = useCallback(async (content: string) => {
        if (!state.currentSession) {
            setState(prev => ({ ...prev, error: 'No active session' }));
            return;
        }

        // DEBUG: Log session info
        console.log('🔍 sendMessage DEBUG:', {
            sessionId: state.currentSession.id,
            sessionIdType: typeof state.currentSession.id,
            sessionIdLength: state.currentSession.id?.length,
            currentSession: state.currentSession,
        });

        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            // Add user message immediately
            const userMessage: ChatMessage = {
                id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                content,
                role: 'user',
                timestamp: new Date(),
                isTyping: false,
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, userMessage],
            }));

            // Prepare messages for API (convert to expected format)
            const apiMessages = [
                { role: 'system', content: state.systemInstruction },
                ...state.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                { role: 'user', content },
            ];

            // Add temporary AI message for streaming
            const tempAiMessage: ChatMessage = {
                id: Math.random().toString(36).substring(2) + Date.now().toString(36),
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

            // Use Enterprise streaming with database persistence
            await aiService.streamChatCompletion(
                state.currentSession.id,
                content,
                apiMessages,
                (chunk: string) => {
                    fullResponse += chunk;

                    // Update message in real-time
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
                    console.log('Usage:', usage);
                }
            );

            // Finalize AI message
            setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                    msg.id === tempAiMessage.id
                        ? { ...msg, content: fullResponse, isTyping: false }
                        : msg
                ),
                isLoading: false,
            }));

            // Update session with last message
            const updatedSession: ChatSession = {
                ...state.currentSession,
                lastMessage: fullResponse.substring(0, 100) + (fullResponse.length > 100 ? '...' : ''),
                timestamp: new Date(),
                messageCount: state.currentSession.messageCount + 2, // user + assistant
            };

            setState(prev => ({
                ...prev,
                currentSession: updatedSession,
                sessions: prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s),
            }));

        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to send message',
                isLoading: false,
                messages: prev.messages.filter(msg => msg.id !== (prev.messages.find(m => m.isTyping)?.id)),
            }));
        }
    }, [state.currentSession, state.messages, state.systemInstruction, aiService]);

    const deleteSession = useCallback(async (sessionId: string) => {
        try {
            await aiService.deleteSession(sessionId);

            setState(prev => {
                const filteredSessions = prev.sessions.filter(s => s.id !== sessionId);
                const newCurrentSession = prev.currentSession?.id === sessionId ? null : prev.currentSession;

                return {
                    ...prev,
                    sessions: filteredSessions,
                    currentSession: newCurrentSession,
                    messages: newCurrentSession ? prev.messages : [],
                };
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to delete session',
            }));
        }
    }, [aiService]);

    const archiveSession = useCallback(async (sessionId: string) => {
        try {
            await aiService.archiveSession(sessionId);
            // Refresh sessions to reflect archived status
            await loadSessions();
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to archive session',
            }));
        }
    }, [aiService, loadSessions]);

    const updateSystemInstruction = useCallback((instruction: string) => {
        setState(prev => ({ ...prev, systemInstruction: instruction }));
    }, []);

    const updateSelectedModel = useCallback((model: LLMModel) => {
        setState(prev => ({ ...prev, selectedModel: model }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        // State
        sessions: state.sessions,
        currentSession: state.currentSession,
        messages: state.messages,
        isLoading: state.isLoading,
        isLoadingSessions: state.isLoadingSessions,
        isLoadingMessages: state.isLoadingMessages,
        error: state.error,
        selectedModel: state.selectedModel,
        systemInstruction: state.systemInstruction,
        availableModels: AVAILABLE_MODELS,

        // Actions
        loadSessions,
        createSession,
        selectSession,
        sendMessage,
        deleteSession,
        archiveSession,
        updateSystemInstruction,
        updateSelectedModel,
        setSelectedModel: updateSelectedModel, // Alias for compatibility
        setSystemInstruction: updateSystemInstruction, // Alias for compatibility
        clearError,
    };
};

export default useEnterpriseAIChat;
