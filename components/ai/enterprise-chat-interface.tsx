import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, DesignSystem } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    isTyping?: boolean;
    tokens?: number;
}

interface EnterpriseChatInterfaceProps {
    session: { id: string; title: string; type: string };
    messages: ChatMessage[];
    onSendMessage: (message: string) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    onBackToSessions: () => void;
    onNewSession: () => void;
}

export const EnterpriseChatInterface: React.FC<EnterpriseChatInterfaceProps> = ({
    session,
    messages,
    onSendMessage,
    isLoading = false,
    error,
    onBackToSessions,
    onNewSession,
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const messageToSend = inputText.trim();
        setInputText('');
        Keyboard.dismiss();

        try {
            await onSendMessage(messageToSend);
            // Scroll to bottom after sending
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.assistantMessageContainer
            ]}>
                <View style={[
                    styles.messageBubble,
                    {
                        backgroundColor: isUser ? colors.primary : colors.surface,
                        borderColor: isUser ? 'transparent' : colors.border,
                    }
                ]}>
                    {!isUser && (
                        <View style={styles.assistantHeader}>
                            <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="sparkles" size={16} color={colors.primary} />
                            </View>
                            <Text style={[styles.assistantLabel, { color: colors.primary }]}>
                                AI Assistant
                            </Text>
                        </View>
                    )}

                    <Text style={[
                        styles.messageText,
                        { color: isUser ? colors.background : colors.text }
                    ]}>
                        {item.content}
                    </Text>

                    {item.isTyping && (
                        <View style={styles.typingIndicator}>
                            <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                            <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                            <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                        </View>
                    )}
                </View>

                <View style={[
                    styles.messageFooter,
                    isUser ? styles.userMessageFooter : styles.assistantMessageFooter
                ]}>
                    <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                        {formatTimestamp(item.timestamp)}
                    </Text>
                    {item.tokens && (
                        <Text style={[styles.tokenCount, { color: colors.textTertiary }]}>
                            {item.tokens} tokens
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.aiAvatarLarge, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                    AI Assistant
                </Text>
                <Text style={[styles.welcomeDescription, { color: colors.textSecondary }]}>
                    Zadaj pytanie, poproś o analizę, pomoc w kodowaniu lub stworzenie projektu.
                    Używam najnowszych modeli AI do profesjonalnej pomocy.
                </Text>

                <View style={styles.suggestions}>
                    {[
                        { icon: 'code-outline', text: 'Pomoc z kodem', prompt: 'Pomóż mi napisać funkcję w...' },
                        { icon: 'analytics-outline', text: 'Analiza danych', prompt: 'Przeanalizuj moje dane dotyczące...' },
                        { icon: 'bulb-outline', text: 'Nowy projekt', prompt: 'Chcę stworzyć projekt...' },
                        { icon: 'document-outline', text: 'Dokumentacja', prompt: 'Napisz dokumentację dla...' },
                    ].map((suggestion) => (
                        <TouchableOpacity
                            key={`suggestion-${suggestion.text}`}
                            style={[styles.suggestionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => setInputText(suggestion.prompt)}
                        >
                            <Ionicons name={suggestion.icon as any} size={16} color={colors.primary} />
                            <Text style={[styles.suggestionText, { color: colors.text }]}>
                                {suggestion.text}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={onBackToSessions}
                    >
                        <Ionicons name="menu-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                            {session.title}
                        </Text>
                        <Text style={[styles.sessionSubtitle, { color: colors.textSecondary }]}>
                            {messages.length} wiadomości
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={onNewSession}
                >
                    <Ionicons name="add-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                onContentSizeChange={() => {
                    if (messages.length > 0) {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }
                }}
            />

            {/* Input Area */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Wpisz wiadomość..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={4000}
                        onSubmitEditing={handleSend}
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            {
                                backgroundColor: inputText.trim() && !isLoading ? colors.primary : '#ccc',
                            }
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Ionicons name="stop-circle-outline" size={20} color={colors.background} />
                        ) : (
                            <Ionicons name="send" size={20} color={colors.background} />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                    {inputText.length}/4000 • Shift+Enter dla nowej linii
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerButton: {
        padding: DesignSystem.spacing.sm,
    },
    titleContainer: {
        marginLeft: DesignSystem.spacing.sm,
        flex: 1,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    sessionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        flexGrow: 1,
    },
    messageContainer: {
        marginVertical: DesignSystem.spacing.xs,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    assistantMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '85%',
        borderRadius: DesignSystem.borderRadius.lg,
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderWidth: 1,
    },
    assistantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DesignSystem.spacing.xs,
    },
    aiAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: DesignSystem.spacing.xs,
    },
    assistantLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    messageFooter: {
        marginTop: 4,
    },
    userMessageFooter: {
        alignItems: 'flex-end',
    },
    assistantMessageFooter: {
        alignItems: 'flex-start',
    },
    timestamp: {
        fontSize: 11,
    },
    tokenCount: {
        fontSize: 10,
        marginTop: 2,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: DesignSystem.spacing.xs,
        gap: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        opacity: 0.5,
        // Add animation later
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: DesignSystem.spacing.lg,
    },
    welcomeCard: {
        borderRadius: DesignSystem.borderRadius['2xl'],
        padding: DesignSystem.spacing['2xl'],
        alignItems: 'center',
        borderWidth: 1,
    },
    aiAvatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DesignSystem.spacing.lg,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: DesignSystem.spacing.sm,
        textAlign: 'center',
    },
    welcomeDescription: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: DesignSystem.spacing.xl,
        maxWidth: 300,
    },
    suggestions: {
        width: '100%',
        gap: DesignSystem.spacing.sm,
    },
    suggestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.lg,
        borderWidth: 1,
        gap: DesignSystem.spacing.sm,
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderTopWidth: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: DesignSystem.borderRadius.xl,
        borderWidth: 1,
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        marginBottom: DesignSystem.spacing.xs,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        maxHeight: 120,
        lineHeight: 22,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: DesignSystem.spacing.sm,
    },
    inputHint: {
        fontSize: 11,
        textAlign: 'center',
    },
});