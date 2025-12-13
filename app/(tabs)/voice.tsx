import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModernCard } from '@/components/modern-card';
import { ModernView } from '@/components/modern-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VoiceRecorder } from '@/components/voice/voice-recorder';
import { VoiceRecordingMenu } from '@/components/voice/voice-recording-menu';
import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/stores/app-store';

export default function VoiceScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const [showRecordingMenu, setShowRecordingMenu] = useState(false);

    const {
        voiceNotes,
        isProcessingVoiceNote,
        loadTasks,
        loadVoiceNotes,
        error,
        clearError
    } = useAppStore();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const onRecordingComplete = React.useCallback(async () => {
        console.log('🔄 Recording completed, refreshing data...');
        await Promise.allSettled([
            loadTasks(),
            loadVoiceNotes()
        ]);
        console.log('✅ Data refreshed after recording');
    }, [loadTasks, loadVoiceNotes]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        clearError(); // Clear any previous errors
        try {
            console.log('🔄 Refreshing voice notes and tasks...');
            await Promise.allSettled([
                loadVoiceNotes(),
                loadTasks()
            ]);
            console.log('✅ Data refreshed successfully');
        } catch (error) {
            console.error('❌ Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [loadVoiceNotes, loadTasks, clearError]);

    // Periodic refresh to catch recordings processed in background
    useEffect(() => {
        const interval = setInterval(() => {
            if (isProcessingVoiceNote) {
                console.log('🔄 Checking for background processing completion...');
                loadVoiceNotes();
            }
        }, 5000); // Check every 5 seconds if processing

        return () => clearInterval(interval);
    }, [isProcessingVoiceNote, loadVoiceNotes]);

    // 🚨 REMOVED: Auto-refresh useEffect that caused infinite loop
    // The useEffect with voiceNotes dependency was triggering infinite refreshes
    // when API calls failed and voiceNotes stayed empty

    // 🛡️ Safety check for voiceNotes array
    const safeVoiceNotes = Array.isArray(voiceNotes) ? voiceNotes : [];
    const recentNotes = safeVoiceNotes
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <ModernView style={{ flex: 1 }}>
            <StatusBar style="auto" />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: DesignSystem.spacing.lg,
                    paddingTop: insets.top + DesignSystem.spacing.lg,
                    paddingBottom: DesignSystem.spacing['4xl'],
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        title="Odświeżanie nagrań..."
                        titleColor={colors.textSecondary}
                    />
                }
            >
                {/* Header with Gradient */}
                <LinearGradient
                    colors={[colors.primary + '15', colors.primary + '05']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        marginBottom: DesignSystem.spacing['3xl'],
                        borderRadius: DesignSystem.borderRadius['2xl'],
                        padding: DesignSystem.spacing.xl,
                        alignItems: 'center',
                    }}
                >
                    <View style={{
                        backgroundColor: colors.primary + '20',
                        borderRadius: DesignSystem.borderRadius.full,
                        padding: DesignSystem.spacing.lg,
                        marginBottom: DesignSystem.spacing.lg,
                    }}>
                        <IconSymbol name="mic.fill" size={32} color={colors.primary} />
                    </View>

                    <ThemedText
                        variant="displaySmall"
                        style={{
                            textAlign: 'center',
                            marginBottom: DesignSystem.spacing.sm,
                            fontWeight: '700',
                        }}
                    >
                        Notatka głosowa
                    </ThemedText>

                    <ThemedText
                        variant="bodyLarge"
                        color="secondary"
                        style={{
                            textAlign: 'center',
                            lineHeight: 24,
                        }}
                    >
                        {isProcessingVoiceNote
                            ? 'Processing your voice note...'
                            : 'Nagraj swoją myśl lub zadanie'
                        }
                    </ThemedText>

                    {/* Processing indicator */}
                    {isProcessingVoiceNote && (
                        <View style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: DesignSystem.spacing.md,
                            gap: DesignSystem.spacing.sm,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DesignSystem.spacing.sm,
                            }}>
                                <View style={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: colors.primary,
                                    borderRadius: 4,
                                    opacity: 0.7,
                                    transform: [{ scale: 1 }],
                                }} />
                                <ThemedText variant="bodySmall" color="secondary">
                                    AI analizuje Twoją notatkę...
                                </ThemedText>
                            </View>
                            <TouchableOpacity
                                style={{
                                    marginTop: DesignSystem.spacing.sm,
                                    paddingVertical: DesignSystem.spacing.xs,
                                    paddingHorizontal: DesignSystem.spacing.sm,
                                    backgroundColor: colors.primary + '10',
                                    borderRadius: DesignSystem.borderRadius.sm,
                                }}
                                onPress={() => {
                                    console.log('🔄 Manual refresh requested');
                                    onRefresh();
                                }}
                                activeOpacity={0.7}
                            >
                                <ThemedText variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }}>
                                    Sprawdź status
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </LinearGradient>

                {/* Error Display */}
                {error && (
                    <ModernCard
                        title="Błąd"
                        elevation={2}
                        style={{
                            marginBottom: DesignSystem.spacing.lg,
                            backgroundColor: '#FFF5F5',
                            borderLeftWidth: 4,
                            borderLeftColor: '#F56565',
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: DesignSystem.spacing.md,
                        }}>
                            <IconSymbol name="exclamationmark.triangle" size={20} color="#F56565" />
                            <View style={{ flex: 1 }}>
                                <ThemedText variant="bodyMedium" style={{ color: '#C53030', lineHeight: 20 }}>
                                    {error}
                                </ThemedText>
                                <TouchableOpacity
                                    style={{
                                        marginTop: DesignSystem.spacing.sm,
                                        paddingVertical: DesignSystem.spacing.xs,
                                    }}
                                    onPress={clearError}
                                    activeOpacity={0.7}
                                >
                                    <ThemedText variant="bodySmall" style={{ color: '#C53030', fontWeight: '600' }}>
                                        Zamknij
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ModernCard>
                )}

                {/* 🏢 ENTERPRISE Voice Recording Options */}
                <ModernCard
                    title="Kategorie nagrań"
                    elevation={3}
                    style={{ marginBottom: DesignSystem.spacing.lg }}
                >
                    <ThemedText
                        variant="bodyMedium"
                        color="secondary"
                        style={{ marginBottom: DesignSystem.spacing.lg, lineHeight: 20 }}
                    >
                        Wybierz typ nagrania dla lepszej organizacji swoich myśli
                    </ThemedText>

                    <TouchableOpacity
                        style={[styles.enterpriseButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowRecordingMenu(true)}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="list.bullet" size={20} color={colors.background} />
                        <ThemedText
                            variant="bodyLarge"
                            style={{ color: colors.background, fontWeight: '600', marginLeft: DesignSystem.spacing.sm }}
                        >
                            Wybierz kategorie nagrania
                        </ThemedText>
                        <IconSymbol name="chevron.right" size={16} color={colors.background} />
                    </TouchableOpacity>
                </ModernCard>

                {/* Voice Recorder */}
                <ModernCard
                    title="Szybkie nagranie"
                    subtitle={isProcessingVoiceNote ? "Przetwarzanie w toku..." : undefined}
                    elevation={3}
                    style={{
                        marginBottom: DesignSystem.spacing.xl,
                        opacity: isProcessingVoiceNote ? 0.7 : 1
                    }}
                >
                    {isProcessingVoiceNote && (
                        <View style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: DesignSystem.spacing.md,
                            paddingVertical: DesignSystem.spacing.md,
                            paddingHorizontal: DesignSystem.spacing.md,
                            backgroundColor: colors.primary + '10',
                            borderRadius: DesignSystem.borderRadius.md,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: DesignSystem.spacing.sm,
                            }}>
                                <IconSymbol name="hourglass" size={16} color={colors.primary} />
                                <ThemedText
                                    variant="bodySmall"
                                    color="secondary"
                                    style={{ marginLeft: DesignSystem.spacing.sm }}
                                >
                                    Processing your voice note...
                                </ThemedText>
                            </View>
                            <ThemedText variant="bodySmall" color="tertiary" style={{ textAlign: 'center', marginBottom: DesignSystem.spacing.sm }}>
                                Jeśli proces trwa długo, sprawdź status poniżej
                            </ThemedText>
                            <TouchableOpacity
                                style={{
                                    paddingVertical: DesignSystem.spacing.xs,
                                    paddingHorizontal: DesignSystem.spacing.md,
                                    backgroundColor: colors.primary,
                                    borderRadius: DesignSystem.borderRadius.sm,
                                }}
                                onPress={() => {
                                    console.log('🔄 Manual refresh from quick recording section');
                                    onRefresh();
                                }}
                                activeOpacity={0.7}
                            >
                                <ThemedText variant="bodySmall" style={{ color: colors.background, fontWeight: '600' }}>
                                    Sprawdź status
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                    <VoiceRecorder onComplete={onRecordingComplete} />
                </ModernCard>

                {/* Quick Tips */}
                <ModernCard
                    title="Wskazówki"
                    elevation={2}
                    style={{ marginBottom: DesignSystem.spacing.xl }}
                >
                    <View style={{ gap: DesignSystem.spacing.md }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DesignSystem.spacing.md,
                        }}>
                            <View style={{
                                backgroundColor: colors.primary + '15',
                                borderRadius: DesignSystem.borderRadius.md,
                                padding: DesignSystem.spacing.sm,
                            }}>
                                <IconSymbol name="lightbulb" size={16} color={colors.primary} />
                            </View>
                            <ThemedText variant="bodyMedium" style={{ flex: 1, lineHeight: 20 }}>
                                Mów naturalnie - opowiadaj o swoich planach, pomysłach i zadaniach
                            </ThemedText>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DesignSystem.spacing.md,
                        }}>
                            <View style={{
                                backgroundColor: colors.primary + '15',
                                borderRadius: DesignSystem.borderRadius.md,
                                padding: DesignSystem.spacing.sm,
                            }}>
                                <IconSymbol name="wand.and.stars" size={16} color={colors.primary} />
                            </View>
                            <ThemedText variant="bodyMedium" style={{ flex: 1, lineHeight: 20 }}>
                                AI automatycznie wyciągnie zadania i stworzy podsumowanie
                            </ThemedText>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DesignSystem.spacing.md,
                        }}>
                            <View style={{
                                backgroundColor: colors.primary + '15',
                                borderRadius: DesignSystem.borderRadius.md,
                                padding: DesignSystem.spacing.sm,
                            }}>
                                <IconSymbol name="clock" size={16} color={colors.primary} />
                            </View>
                            <ThemedText variant="bodyMedium" style={{ flex: 1, lineHeight: 20 }}>
                                Najlepiej nagraj w ciągu 30-90 sekund
                            </ThemedText>
                        </View>
                    </View>
                </ModernCard>

                {/* Recent Notes */}
                {(Array.isArray(voiceNotes) ? voiceNotes.length : 0) > 0 ? (
                    <ModernCard
                        title="Ostatnie notatki"
                        subtitle={`${recentNotes.length} najnowszych nagrań`}
                        elevation={2}
                    >
                        <View style={{ gap: DesignSystem.spacing.md }}>
                            {recentNotes.map((note) => (
                                <ModernView
                                    key={note.id}
                                    variant="surfaceSecondary"
                                    borderRadius="lg"
                                    padding="md"
                                >
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: DesignSystem.spacing.sm,
                                    }}>
                                        <ThemedText variant="bodySmall" color="tertiary">
                                            {new Date(note.createdAt).toLocaleString('pl-PL', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </ThemedText>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: DesignSystem.spacing.xs,
                                        }}>
                                            <IconSymbol name="clock" size={12} color={colors.iconSecondary} />
                                            <ThemedText variant="bodySmall" color="tertiary">
                                                {Math.round(note.duration || 0)}s
                                            </ThemedText>
                                        </View>
                                    </View>
                                    {note.transcript && (
                                        <ThemedText variant="bodyMedium" numberOfLines={2}>
                                            {note.transcript.substring(0, 100)}
                                            {note.transcript.length > 100 ? '...' : ''}
                                        </ThemedText>
                                    )}
                                    {note.processed && note.summary && (
                                        <View style={{
                                            backgroundColor: colors.primary + '10',
                                            padding: DesignSystem.spacing.sm,
                                            borderRadius: DesignSystem.borderRadius.md,
                                            marginTop: DesignSystem.spacing.sm,
                                        }}>
                                            <ThemedText variant="bodySmall" color="secondary">
                                                AI: {note.summary.substring(0, 80)}
                                                {note.summary.length > 80 ? '...' : ''}
                                            </ThemedText>
                                        </View>
                                    )}
                                </ModernView>
                            ))}
                        </View>
                    </ModernCard>
                ) : !isProcessingVoiceNote ? (
                    <ModernCard
                        title="Brak nagrań"
                        elevation={1}
                        style={{
                            backgroundColor: colors.surface + '50',
                            borderWidth: 1,
                            borderColor: colors.border + '30',
                            borderStyle: 'dashed',
                        }}
                    >
                        <View style={{
                            alignItems: 'center',
                            paddingVertical: DesignSystem.spacing.xl,
                        }}>
                            <View style={{
                                backgroundColor: colors.iconSecondary + '10',
                                borderRadius: DesignSystem.borderRadius.full,
                                padding: DesignSystem.spacing.lg,
                                marginBottom: DesignSystem.spacing.md,
                            }}>
                                <IconSymbol name="mic.slash" size={32} color={colors.iconSecondary} />
                            </View>
                            <ThemedText
                                variant="bodyLarge"
                                color="secondary"
                                style={{
                                    textAlign: 'center',
                                    marginBottom: DesignSystem.spacing.sm,
                                    fontWeight: '600'
                                }}
                            >
                                Nie masz jeszcze żadnych nagrań
                            </ThemedText>
                            <ThemedText
                                variant="bodyMedium"
                                color="tertiary"
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 20
                                }}
                            >
                                Nagraj swoją pierwszą notatkę głosową, aby zobaczyć ją tutaj
                            </ThemedText>
                        </View>
                    </ModernCard>
                ) : null}
            </ScrollView>

            {/* 🏢 ENTERPRISE Voice Recording Menu */}
            <VoiceRecordingMenu
                visible={showRecordingMenu}
                onClose={() => setShowRecordingMenu(false)}
            />
        </ModernView>
    );
}

const styles = StyleSheet.create({
    enterpriseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: DesignSystem.spacing.md,
        paddingHorizontal: DesignSystem.spacing.lg,
        borderRadius: DesignSystem.borderRadius.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
});