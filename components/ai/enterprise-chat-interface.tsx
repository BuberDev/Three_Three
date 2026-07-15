import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, DesignSystem } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useVoiceRecording } from '../../hooks/use-voice-recording';
import { AudioRecording } from '../../lib/types';
import { getApiUrl } from '../../lib/utils/config';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

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
    chatSessions?: Array<{ id: string; title: string; lastMessage?: string; timestamp: Date }>;
    onSelectSession?: (sessionId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.75;

/**
 * Process voice recording to text using backend API
 */
const processVoiceToText = async (audioUri: string): Promise<string | null> => {
    try {
        console.log('🔊 Processing audio file:', audioUri);

        // For React Native - send to our backend
        if (audioUri.startsWith('file://')) {
            try {
                console.log('📤 Preparing to send audio to backend...');
                console.log('🔗 Backend URL:', getApiUrl());

                // Read the audio file
                const response = await fetch(audioUri);
                console.log('📁 Audio file fetch response:', response.status);
                const audioBlob = await response.blob();
                console.log('📦 Audio blob size:', audioBlob.size, 'bytes');

                // Create FormData for upload
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.m4a');
                console.log('📋 FormData created with audio file');

                const backendUrl = `${getApiUrl()}/api/ai/speech-to-text`;
                console.log('🚀 Sending request to:', backendUrl);

                // Send to our backend speech-to-text endpoint
                const backendResponse = await fetch(backendUrl, {
                    method: 'POST',
                    body: formData,
                });

                console.log('📨 Backend response status:', backendResponse.status);
                console.log('📨 Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

                if (backendResponse.ok) {
                    const result = await backendResponse.json();
                    console.log('✅ Backend response data:', result);

                    // Parse nested response structure: result.data.data.transcription
                    const transcriptionData = result?.data?.data;
                    if (transcriptionData?.success && transcriptionData?.transcription) {
                        console.log('✅ Backend transcription:', transcriptionData.transcription);
                        return transcriptionData.transcription;
                    } else {
                        console.log('⚠️ No valid transcription in response:', transcriptionData);
                    }
                } else {
                    const errorText = await backendResponse.text();
                    console.error('❌ Backend error response:', errorText);
                }
            } catch (backendError) {
                console.error('❌ Backend request failed:', backendError);
                console.log('❌ Falling back to Web Speech API');
            }
        }

        // Fallback: Try Web Speech API for browser
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            return new Promise((resolve, reject) => {
                try {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();

                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'pl-PL';
                    recognition.maxAlternatives = 1;

                    let hasResult = false;

                    recognition.onresult = (event: any) => {
                        hasResult = true;
                        const transcript = event.results[0][0].transcript;
                        console.log('✅ Web Speech API transcription:', transcript);
                        resolve(transcript);
                    };

                    recognition.onerror = (event: any) => {
                        if (!hasResult) {
                            console.error('❌ Web Speech API error:', event.error);
                            reject(new Error(`Speech recognition error: ${event.error}`));
                        }
                    };

                    recognition.onend = () => {
                        if (!hasResult) {
                            reject(new Error('No speech detected'));
                        }
                    };

                    console.log('🎤 Starting Web Speech API recognition...');
                    recognition.start();

                } catch (error) {
                    reject(error);
                }
            });
        }

        throw new Error('No speech recognition method available');

    } catch (error) {
        console.error('❌ All speech recognition methods failed:', error);
        return null;
    }
};

export const EnterpriseChatInterface: React.FC<EnterpriseChatInterfaceProps> = ({
    session,
    messages,
    onSendMessage,
    isLoading = false,
    error,
    onBackToSessions,
    onNewSession,
    chatSessions = [],
    onSelectSession,
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [inputText, setInputText] = useState('');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);

    // Wrap setInputText to debug changes
    const debugSetInputText = React.useCallback((value: string | ((prev: string) => string)) => {
        const finalValue = typeof value === 'function' ? value(inputText) : value;
        console.log('🔍 setInputText called with:', JSON.stringify(finalValue));
        setInputText(finalValue);
    }, [inputText]);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Voice recording hook
    const {
        isRecording,
        duration,
        canRecord,
        recordOnly,
    } = useVoiceRecording();

    // Debug effect to monitor inputText changes
    React.useEffect(() => {
        console.log('🔍 inputText state changed to:', inputText);
        // If inputText contains voice recording indicator, focus the input
        if (inputText.includes('[Nagranie głosowe') && inputRef.current) {
            console.log('🔍 Voice text detected, but skipping focus for debugging...');
            // Temporarily disable focus to test if it's the issue
            // setTimeout(() => {
            //     inputRef.current?.focus();
            // }, 100);
        }
    }, [inputText]);

    React.useEffect(() => {
        if (sidebarVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [sidebarVisible]);

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

    const handleVoiceRecording = async () => {
        if (!canRecord) {
            console.warn('Voice recording not available');
            return;
        }

        try {
            setIsVoiceRecording(true);
            const result = await recordOnly();
            console.log('🎯 handleVoiceRecording result:', result, 'type:', typeof result);

            if (result && typeof result === 'object' && 'uri' in result) {
                // Recording completed successfully
                const audioRecording = result as AudioRecording;
                console.log('🎙️ Audio recording completed:', audioRecording);

                // Show temporary placeholder while processing
                const tempIndicator = `[Przetwarzanie nagrania ${Math.ceil(audioRecording.duration / 1000)}s...]`;
                console.log('📝 Adding temporary placeholder:', tempIndicator);
                console.log('📝 Current inputText before update:', inputText);

                const tempText = inputText + tempIndicator;
                console.log('📝 Temp text to set:', tempText);
                debugSetInputText(tempText);

                // Reset recording state immediately after successful completion
                setIsVoiceRecording(false);

                // Process speech-to-text
                try {
                    console.log('🔊 Starting speech-to-text processing...');
                    const transcription = await processVoiceToText(audioRecording.uri);

                    if (transcription && transcription.trim()) {
                        // Replace placeholder with actual transcription
                        console.log('✅ Speech-to-text successful:', transcription);
                        const finalText = inputText + transcription;
                        debugSetInputText(finalText);
                    } else {
                        // If transcription failed, replace with error message
                        console.log('❌ Speech-to-text failed or returned empty');
                        const errorText = inputText + '[Nie udało się rozpoznać mowy]';
                        debugSetInputText(errorText);
                    }
                } catch (error) {
                    console.error('❌ Speech-to-text error:', error);
                    // Replace placeholder with error message
                    const errorText = inputText + '[Błąd rozpoznawania mowy]';
                    debugSetInputText(errorText);
                }

                // Log current state for debugging
                console.log('🔍 Voice recording processing completed');
            } else if (result === 'recording-started') {
                console.log('🎬 Recording started, waiting for user to stop...');
                // Recording started, keep the UI in recording state
                // The user will tap again to stop
            } else {
                console.log('⚠️ Unexpected result from recordOnly:', result);
            }
        } catch (error) {
            console.error('Voice recording failed:', error);
        } finally {
            // Only reset recording state if we're not actively recording
            if (!isRecording) {
                setIsVoiceRecording(false);
            }
        }
    };

    const getVoiceButtonColor = () => {
        if (isRecording) return colors.error;
        if (isVoiceRecording) return colors.primary;
        return colors.textSecondary;
    };

    const getVoiceButtonIcon = (): keyof typeof Ionicons.glyphMap => {
        if (isRecording) return 'stop-circle';
        return 'mic';
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
                        onPress={() => setSidebarVisible(true)}
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
                        onChangeText={debugSetInputText}
                        multiline
                        maxLength={4000}
                        onSubmitEditing={handleSend}
                        textAlignVertical="center"
                    />

                    {/* Voice Recording Button */}
                    <TouchableOpacity
                        style={[
                            styles.voiceButton,
                            {
                                backgroundColor: (isRecording || isVoiceRecording) ? getVoiceButtonColor() + '15' : 'transparent',
                            }
                        ]}
                        onPress={handleVoiceRecording}
                        disabled={!canRecord}
                    >
                        <Ionicons
                            name={getVoiceButtonIcon()}
                            size={22}
                            color={getVoiceButtonColor()}
                        />
                    </TouchableOpacity>

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

                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
                        <Text style={[styles.recordingText, { color: colors.error }]}>
                            Nagrywanie... {Math.ceil(duration / 1000)}s
                        </Text>
                    </View>
                )}

                <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                    {inputText.length}/4000 • Shift+Enter dla nowej linii • Mikrofon dla nagrania głosu
                </Text>
            </View>

            {/* Sidebar */}
            {sidebarVisible && (
                <View style={styles.sidebarContainer}>
                    {/* Overlay */}
                    <Animated.View
                        style={[
                            styles.overlay,
                            {
                                opacity: overlayOpacity,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.overlayTouchable}
                            onPress={() => setSidebarVisible(false)}
                            activeOpacity={1}
                        />
                    </Animated.View>

                    {/* Sidebar Content */}
                    <Animated.View
                        style={[
                            styles.sidebar,
                            {
                                backgroundColor: colors.surface,
                                transform: [{ translateX: slideAnim }],
                                paddingTop: insets.top,
                            },
                        ]}
                    >
                        <View style={styles.sidebarContent}>
                            {/* Header */}
                            <View style={styles.sidebarHeader}>
                                <View style={styles.sidebarHeaderContent}>
                                    <View style={styles.logoContainer}>
                                        <IconSymbol
                                            name="sparkles"
                                            size={28}
                                            color={colors.primary}
                                        />
                                        <ThemedText variant="titleLarge" style={[styles.appTitle, { color: colors.text }]}>
                                            AI Chat
                                        </ThemedText>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setSidebarVisible(false)}
                                        style={styles.closeButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close-outline" size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                                {/* Current Session Info */}
                                <View style={styles.section}>
                                    <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                        AKTUALNA SESJA
                                    </ThemedText>
                                    <View style={[styles.currentSessionCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>
                                        <View style={styles.sessionInfo}>
                                            <ThemedText variant="bodyLarge" style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                                                {session.title}
                                            </ThemedText>
                                            <ThemedText variant="bodySmall" style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                                                {messages.length} wiadomości • {session.type}
                                            </ThemedText>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.newSessionButton, { backgroundColor: colors.primary }]}
                                            onPress={() => {
                                                setSidebarVisible(false);
                                                onNewSession();
                                            }}
                                        >
                                            <Ionicons name="add" size={16} color={colors.background} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Chat History */}
                                <View style={styles.section}>
                                    <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                        HISTORIA ROZMÓW
                                    </ThemedText>
                                    {chatSessions.slice(0, 6).map((chatSession) => (
                                        <TouchableOpacity
                                            key={chatSession.id}
                                            style={[styles.chatHistoryItem, {
                                                backgroundColor: chatSession.id === session.id ? colors.primary + '10' : colors.background + '80',
                                                borderColor: chatSession.id === session.id ? colors.primary + '20' : 'transparent',
                                            }]}
                                            onPress={() => {
                                                if (onSelectSession && chatSession.id !== session.id) {
                                                    setSidebarVisible(false);
                                                    onSelectSession(chatSession.id);
                                                }
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.chatHistoryContent}>
                                                <View style={[styles.chatIcon, { backgroundColor: colors.primary + '15' }]}>
                                                    <Ionicons name="chatbubble" size={14} color={colors.primary} />
                                                </View>
                                                <View style={styles.chatTextContainer}>
                                                    <ThemedText
                                                        variant="bodyMedium"
                                                        style={[styles.chatTitle, { color: colors.text }]}
                                                        numberOfLines={1}
                                                    >
                                                        {chatSession.title}
                                                    </ThemedText>
                                                    {chatSession.lastMessage && (
                                                        <ThemedText
                                                            variant="bodySmall"
                                                            style={[styles.lastMessage, { color: colors.textSecondary }]}
                                                            numberOfLines={1}
                                                        >
                                                            {chatSession.lastMessage}
                                                        </ThemedText>
                                                    )}
                                                    <ThemedText variant="bodySmall" style={[styles.chatTimestamp, { color: colors.textTertiary }]}>
                                                        {chatSession.timestamp.toLocaleDateString('pl-PL')}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                            {chatSession.id === session.id && (
                                                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                    {chatSessions.length === 0 && (
                                        <View style={styles.emptySection}>
                                            <ThemedText variant="bodySmall" style={[styles.emptyText, { color: colors.textSecondary }]}>
                                                Brak historii rozmów
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>

                                {/* Quick Actions */}
                                <View style={styles.section}>
                                    <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                        SZYBKIE AKCJE
                                    </ThemedText>
                                    <TouchableOpacity
                                        style={[styles.quickActionItem, { backgroundColor: colors.background + '80' }]}
                                        onPress={() => {
                                            setSidebarVisible(false);
                                            onNewSession();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                        <ThemedText variant="bodyMedium" style={[styles.quickActionTitle, { color: colors.text }]}>
                                            Nowa rozmowa
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.quickActionItem, { backgroundColor: colors.background + '80' }]}
                                        onPress={() => {
                                            setSidebarVisible(false);
                                            // Add export functionality
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                                        <ThemedText variant="bodyMedium" style={[styles.quickActionTitle, { color: colors.text }]}>
                                            Eksportuj rozmowę
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.quickActionItem, { backgroundColor: colors.background + '80' }]}
                                        onPress={() => {
                                            setSidebarVisible(false);
                                            onBackToSessions();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="settings-outline" size={20} color={colors.primary} />
                                        <ThemedText variant="bodyMedium" style={[styles.quickActionTitle, { color: colors.text }]}>
                                            Ustawienia AI
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </Animated.View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 10
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
        alignItems: 'center',
        borderRadius: DesignSystem.borderRadius.xl,
        borderWidth: 1,
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        marginBottom: DesignSystem.spacing.xs,
        minHeight: 48,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        maxHeight: 120,
        lineHeight: 22,
        paddingVertical: DesignSystem.spacing.xs,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    voiceButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: DesignSystem.spacing.xs,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: DesignSystem.spacing.xs,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DesignSystem.spacing.xs,
        gap: DesignSystem.spacing.xs,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    recordingText: {
        fontSize: 12,
        fontWeight: '500',
    },
    inputHint: {
        fontSize: 11,
        textAlign: 'center',
    },
    // Sidebar styles
    sidebarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayTouchable: {
        flex: 1,
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    sidebarContent: {
        flex: 1,
    },
    sidebarHeader: {
        paddingHorizontal: DesignSystem.spacing.lg,
        paddingVertical: DesignSystem.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#00000010',
    },
    sidebarHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
    },
    appTitle: {
        fontWeight: '700',
    },
    closeButton: {
        padding: DesignSystem.spacing.xs,
    },
    scrollContent: {
        flex: 1,
    },
    section: {
        paddingHorizontal: DesignSystem.spacing.lg,
        marginBottom: DesignSystem.spacing.xl,
    },
    sectionTitle: {
        marginBottom: DesignSystem.spacing.md,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    currentSessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.lg,
        borderWidth: 1,
        gap: DesignSystem.spacing.sm,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionMeta: {
        fontSize: 12,
        lineHeight: 16,
    },
    newSessionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatHistoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: DesignSystem.spacing.xs,
        borderWidth: 1,
        gap: DesignSystem.spacing.sm,
    },
    chatHistoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: DesignSystem.spacing.sm,
    },
    chatIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatTextContainer: {
        flex: 1,
    },
    chatTitle: {
        fontWeight: '500',
        marginBottom: 2,
    },
    lastMessage: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 2,
    },
    chatTimestamp: {
        fontSize: 10,
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: DesignSystem.spacing.xs,
        gap: DesignSystem.spacing.sm,
    },
    quickActionTitle: {
        fontWeight: '500',
    },
    emptySection: {
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.lg,
        alignItems: 'center',
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 12,
    },
});
