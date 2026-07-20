import React, { useState } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AISettingsModal } from '@/components/ai/ai-settings-modal';
import { AnalyticsView } from '@/components/ai/analytics-view';
import { ChatSessionManager } from '@/components/ai/chat-session-manager';
import { EnterpriseChatInterface } from '@/components/ai/enterprise-chat-interface';
import { SubscriptionGate } from '@/components/subscription/subscription-gate';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useEnterpriseAIChat } from '@/hooks/use-enterprise-ai-chat';
import { useAppStore } from '@/stores/app-store';

export default function AIScreen() {
    const insets = useSafeAreaInsets();
    const [currentView, setCurrentView] = useState<'chat' | 'analytics'>('chat');
    const [showSettings, setShowSettings] = useState(false);
    const {
        tasks,
        todaysTasks,
        voiceNotes,
        userSettings
    } = useAppStore();

    const aiChat = useEnterpriseAIChat();

    // Analiza danych dla statystyk
    const completedTasks = todaysTasks.filter(t => t.completed);
    const completionRate = todaysTasks.length > 0 ? Math.round((completedTasks.length / todaysTasks.length) * 100) : 0;

    // Symulacja danych analitycznych
    const mockInsights = [
        {
            type: 'productivity',
            title: 'Najlepszy czas na zadania',
            description: 'Twoja produktywność jest najwyższa między 9:00 a 11:00',
            confidence: 85,
            icon: 'chart.bar.fill'
        },
        {
            type: 'pattern',
            title: 'Wzorzec wykonywania zadań',
            description: 'Najczęściej wykonujesz zadania w środy i piątki',
            confidence: 72,
            icon: 'brain'
        },
        {
            type: 'suggestion',
            title: 'Optymalizacja rutyny',
            description: 'Rozważ podzielenie długich zadań na krótsze sesje',
            confidence: 90,
            icon: 'paperplane.fill'
        }
    ];

    const weeklyProgress = [
        { day: 'Pon', completed: 3, planned: 5 },
        { day: 'Wt', completed: 4, planned: 4 },
        { day: 'Śr', completed: 2, planned: 6 },
        { day: 'Czw', completed: 5, planned: 5 },
        { day: 'Pt', completed: 3, planned: 4 },
        { day: 'Sob', completed: 1, planned: 2 },
        { day: 'Nd', completed: 0, planned: 1 },
    ];

    return (
        <SubscriptionGate
            feature="ai_chat"
            screenTitle="AI Asystent"
        >
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Navigation Header */}
                <View style={[
                    currentView === 'chat' && aiChat.currentSession ? styles.compactHeader : styles.navigationHeader,
                    { paddingTop: insets.top + (currentView === 'chat' && aiChat.currentSession ? 5 : 10) }
                ]}>
                    {!(currentView === 'chat' && aiChat.currentSession) && (
                        <View style={styles.navContent}>
                            <IconSymbol name="brain" size={32} color={Colors.light.tint} />
                            <ThemedText variant="headlineMedium" style={styles.navTitle}>
                                AI Assistant
                            </ThemedText>
                        </View>
                    )}

                    <View style={styles.headerMain}>
                        <View style={currentView === 'chat' && aiChat.currentSession ? styles.compactTabs : styles.navTabs}>
                            <TouchableOpacity
                                style={[styles.navTab, currentView === 'chat' && styles.activeNavTab]}
                                onPress={() => setCurrentView('chat')}
                            >
                                <IconSymbol
                                    name="message.circle.fill"
                                    size={currentView === 'chat' && aiChat.currentSession ? 14 : 20}
                                    color={currentView === 'chat' ? '#fff' : Colors.light.tint}
                                />
                                {!(currentView === 'chat' && aiChat.currentSession) && (
                                    <ThemedText style={[
                                        styles.navTabText,
                                        currentView === 'chat' && styles.activeNavTabText
                                    ]}>
                                        Chat
                                    </ThemedText>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navTab, currentView === 'analytics' && styles.activeNavTab]}
                                onPress={() => setCurrentView('analytics')}
                            >
                                <IconSymbol
                                    name="chart.bar.fill"
                                    size={currentView === 'analytics' && aiChat.currentSession ? 14 : 20}
                                    color={currentView === 'analytics' ? '#fff' : Colors.light.tint}
                                />
                                {!(currentView === 'chat' && aiChat.currentSession) && (
                                    <ThemedText style={[
                                        styles.navTabText,
                                        currentView === 'analytics' && styles.activeNavTabText
                                    ]}>
                                        Analiza
                                    </ThemedText>
                                )}
                            </TouchableOpacity>

                            {/* Beta Tab - tylko dla użytkowników z betaFeaturesEnabled */}
                            {userSettings?.betaFeaturesEnabled && (
                                <TouchableOpacity
                                    style={[styles.navTab, styles.betaTab]}
                                    onPress={() => setCurrentView('chat')}
                                >
                                    <IconSymbol
                                        name="flask.fill"
                                        size={currentView === 'chat' && aiChat.currentSession ? 14 : 20}
                                        color="#ff6b35"
                                    />
                                    <View style={styles.betaBadge}>
                                        <ThemedText style={styles.betaBadgeText}>BETA</ThemedText>
                                    </View>
                                    {!(currentView === 'chat' && aiChat.currentSession) && (
                                        <ThemedText style={[styles.navTabText, styles.betaTabText]}>
                                            AI Lab
                                        </ThemedText>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.settingsButton,
                                { borderColor: Colors.light.tint + '30' },
                                currentView === 'chat' && aiChat.currentSession && styles.compactSettingsButton
                            ]}
                            onPress={() => setShowSettings(true)}
                        >
                            <IconSymbol
                                name="gear"
                                size={currentView === 'chat' && aiChat.currentSession ? 14 : 18}
                                color={Colors.light.tint}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                {currentView === 'chat' ? (
                    <View style={styles.chatContainer}>
                        {aiChat.currentSession ? (
                            <EnterpriseChatInterface
                                session={aiChat.currentSession}
                                messages={aiChat.messages}
                                isLoading={aiChat.isLoading}
                                error={aiChat.error}
                                onSendMessage={aiChat.sendMessage}
                                onBackToSessions={() => aiChat.selectSession(null)}
                                onNewSession={() => aiChat.createSession('Nowa sesja', 'general')}
                            />
                        ) : (
                            <ChatSessionManager
                                sessions={aiChat.sessions}
                                onCreateSession={aiChat.createSession}
                                onSelectSession={aiChat.selectSession}
                                onDeleteSession={aiChat.deleteSession}
                            />
                        )}
                    </View>
                ) : (
                    <AnalyticsView
                        completionRate={completionRate}
                        tasks={tasks}
                        voiceNotes={voiceNotes}
                        weeklyProgress={weeklyProgress}
                        mockInsights={mockInsights}
                        insets={insets}
                    />
                )}

                {/* AI Settings Modal */}
                <AISettingsModal
                    visible={showSettings}
                    onClose={() => setShowSettings(false)}
                    systemInstruction={aiChat.systemInstruction}
                    onSystemInstructionChange={aiChat.setSystemInstruction}
                />
            </View>
        </SubscriptionGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    navigationHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    betaTab: {
        position: 'relative',
        borderColor: '#ff6b35',
    },
    betaBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: '#ff6b35',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    betaBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: 'white',
    },
    betaTabText: {
        color: '#ff6b35',
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    navTitle: {
        color: Colors.light.tint,
        fontWeight: '700',
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    settingsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginLeft: 12,
    },
    navTabs: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 4,
    },
    chatContainer: {
        flex: 1,
    },
    compactHeader: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingBottom: 8,

    },
    compactTabs: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 2,
        height: 32,
        minWidth: 80,
    },
    navTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        gap: 4,
        minWidth: 36,
    },
    activeNavTab: {
        backgroundColor: Colors.light.tint,
    },
    navTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.tint,
    },
    activeNavTabText: {
        color: '#fff',
    },
    compactSettingsButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginLeft: 8,
    },
});
