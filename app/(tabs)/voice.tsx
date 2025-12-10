import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModernCard } from '@/components/modern-card';
import { ModernView } from '@/components/modern-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VoiceRecorder } from '@/components/voice/voice-recorder';
import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/stores/app-store';

export default function VoiceScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const {
        voiceNotes,
        isProcessingVoiceNote,
        loadTasks
    } = useAppStore();

    const onRecordingComplete = React.useCallback(async () => {
        await loadTasks();
    }, [loadTasks]);

    const recentNotes = voiceNotes
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
                            ? 'Przetwarzam Twoją notatkę...'
                            : 'Nagraj swoją myśl lub zadanie'
                        }
                    </ThemedText>
                </LinearGradient>

                {/* Voice Recorder */}
                <ModernCard
                    elevation={3}
                    style={{ marginBottom: DesignSystem.spacing.xl }}
                >
                    <VoiceRecorder onRecordingComplete={onRecordingComplete} />
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
                {recentNotes.length > 0 && (
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
                )}
            </ScrollView>
        </ModernView>
    );
}