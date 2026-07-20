import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ModernCard } from '../modern-card';
import { ModernView } from '../modern-view';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface ConsentScreenProps {
    onContinue: (consents: { voiceProcessing: boolean; personalization: boolean }) => void;
    onBack: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onContinue, onBack }) => {
    const [voiceProcessingConsent, setVoiceProcessingConsent] = useState(false);
    const [personalizationConsent, setPersonalizationConsent] = useState(false);
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleContinue = () => {
        onContinue({
            voiceProcessing: voiceProcessingConsent,
            personalization: personalizationConsent
        });
    };

    const canContinue = voiceProcessingConsent; // Voice processing is required

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <ModernView style={{ flex: 1 }}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: DesignSystem.spacing.lg,
                    paddingVertical: DesignSystem.spacing.md,
                }}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={{
                            backgroundColor: colors.surfaceSecondary,
                            borderRadius: DesignSystem.borderRadius.lg,
                            padding: DesignSystem.spacing.md,
                            marginRight: DesignSystem.spacing.md,
                        }}
                    >
                        <IconSymbol name="arrow.left" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText variant="titleMedium" style={{ fontWeight: '600' }}>
                        Prywatność
                    </ThemedText>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: DesignSystem.spacing.lg,
                        paddingBottom: insets.bottom + 184,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* Header Section */}
                    <View style={{
                        alignItems: 'center',
                        paddingTop: DesignSystem.spacing.lg, // Less top padding
                        paddingBottom: DesignSystem.spacing.xl,
                    }}>
                        <View style={{
                            backgroundColor: colors.surfaceSecondary,
                            borderRadius: DesignSystem.borderRadius.full,
                            padding: DesignSystem.spacing.xl,
                            marginBottom: DesignSystem.spacing.xl,
                        }}>
                            <IconSymbol
                                name="shield.fill"
                                size={48}
                                color={colors.primary}
                            />
                        </View>
                        <ThemedText
                            variant="displaySmall"
                            style={{
                                textAlign: 'center',
                                marginBottom: DesignSystem.spacing.md,
                                fontWeight: '700',
                            }}
                        >
                            Twoje dane. Twoje decyzje.
                        </ThemedText>
                        <ThemedText
                            variant="bodyLarge"
                            color="secondary"
                            style={{ textAlign: 'center', lineHeight: 26 }}
                        >
                            Wyjaśniamy dokładnie, jak przetwarzamy Twoje dane.
                        </ThemedText>
                    </View>

                    {/* Consent Items */}
                    <View style={{ gap: DesignSystem.spacing.lg }}>
                        {/* Voice Processing */}
                        <ModernCard elevation={2}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: DesignSystem.spacing.md,
                            }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variant="titleMedium" style={{ fontWeight: '600', marginBottom: DesignSystem.spacing.xs }}>
                                        Analiza notatek głosowych
                                    </ThemedText>
                                    <View style={{
                                        backgroundColor: colors.primary + '15',
                                        paddingHorizontal: DesignSystem.spacing.sm,
                                        paddingVertical: DesignSystem.spacing.xs,
                                        borderRadius: DesignSystem.borderRadius.sm,
                                        alignSelf: 'flex-start',
                                    }}>
                                        <ThemedText
                                            variant="bodySmall"
                                            style={{
                                                color: colors.primary,
                                                fontWeight: '600'
                                            }}
                                        >
                                            Wymagane
                                        </ThemedText>
                                    </View>
                                </View>
                                <Switch
                                    value={voiceProcessingConsent}
                                    onValueChange={setVoiceProcessingConsent}
                                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                                    thumbColor={voiceProcessingConsent ? colors.primary : colors.icon}
                                    style={{ transform: [{ scale: 1.1 }] }}
                                />
                            </View>
                            <ThemedText
                                variant="bodyMedium"
                                color="secondary"
                                style={{ lineHeight: 22, marginBottom: DesignSystem.spacing.md }}
                            >
                                Zgadzam się na analizę moich notatek głosowych w celu automatycznego tworzenia zadań i podsumowań.
                            </ThemedText>
                            <View style={{
                                backgroundColor: colors.backgroundTertiary,
                                padding: DesignSystem.spacing.md,
                                borderRadius: DesignSystem.borderRadius.md,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.primary,
                            }}>
                                <ThemedText variant="bodySmall" color="secondary">
                                    ✓ Nagrania są przetwarzane lokalnie na urządzeniu{'\n'}
                                    ✓ Dane nie są udostępniane podmiotom trzecim{'\n'}
                                    ✓ Możesz usunąć swoje dane w każdej chwili
                                </ThemedText>
                            </View>
                        </ModernCard>

                        {/* Personalization */}
                        <ModernCard elevation={2}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: DesignSystem.spacing.md,
                            }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variant="titleMedium" style={{ fontWeight: '600', marginBottom: DesignSystem.spacing.xs }}>
                                        Personalizacja doświadczenia
                                    </ThemedText>
                                    <View style={{
                                        backgroundColor: colors.iconSecondary + '15',
                                        paddingHorizontal: DesignSystem.spacing.sm,
                                        paddingVertical: DesignSystem.spacing.xs,
                                        borderRadius: DesignSystem.borderRadius.sm,
                                        alignSelf: 'flex-start',
                                    }}>
                                        <ThemedText
                                            variant="bodySmall"
                                            color="secondary"
                                            style={{ fontWeight: '600' }}
                                        >
                                            Opcjonalne
                                        </ThemedText>
                                    </View>
                                </View>
                                <Switch
                                    value={personalizationConsent}
                                    onValueChange={setPersonalizationConsent}
                                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                                    thumbColor={personalizationConsent ? colors.primary : colors.icon}
                                    style={{ transform: [{ scale: 1.1 }] }}
                                />
                            </View>
                            <ThemedText
                                variant="bodyMedium"
                                color="secondary"
                                style={{ lineHeight: 22, marginBottom: DesignSystem.spacing.md }}
                            >
                                Pozwól na analizę wzorców aktywności w celu lepszego dopasowania rekomendacji i funkcji aplikacji.
                            </ThemedText>
                            <View style={{
                                backgroundColor: colors.backgroundTertiary,
                                padding: DesignSystem.spacing.md,
                                borderRadius: DesignSystem.borderRadius.md,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.iconSecondary,
                            }}>
                                <ThemedText variant="bodySmall" color="secondary">
                                    • Lepsze rekomendacje AI{'\n'}
                                    • Spersonalizowane powiadomienia{'\n'}
                                    • Analiza wzorców produktywności
                                </ThemedText>
                            </View>
                        </ModernCard>
                    </View>

                    {/* Additional Info */}
                    <ModernView
                        style={{
                            marginTop: DesignSystem.spacing.xl,
                            padding: DesignSystem.spacing.lg,
                            backgroundColor: colors.backgroundTertiary,
                            borderRadius: DesignSystem.borderRadius.lg,
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: DesignSystem.spacing.md,
                        }}>
                            <IconSymbol name="info.circle" size={20} color={colors.primary} />
                            <ThemedText
                                variant="titleSmall"
                                style={{ marginLeft: DesignSystem.spacing.sm, fontWeight: '600' }}
                            >
                                Ważne informacje
                            </ThemedText>
                        </View>
                        <ThemedText variant="bodySmall" color="secondary" style={{ lineHeight: 20 }}>
                            Twoje zgody możesz zmienić w każdej chwili w ustawieniach aplikacji. Aplikacja działa offline i dane nie opuszczają Twojego urządzenia bez Twojej zgody.
                        </ThemedText>
                    </ModernView>
                </ScrollView>

                {/* Bottom Action */}
                <View style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    paddingHorizontal: DesignSystem.spacing.lg,
                    paddingTop: DesignSystem.spacing.lg,
                    paddingBottom: Math.max(insets.bottom, 16) + 16,
                    backgroundColor: colors.background,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    zIndex: 30,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: -4,
                    },
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                }}>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        onPress={handleContinue}
                        disabled={!canContinue}
                        style={[
                            styles.primaryAction,
                            { backgroundColor: colors.primary },
                            !canContinue && [styles.primaryActionDisabled, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }],
                        ]}
                    >
                        <Text
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.82}
                            style={[
                                styles.primaryActionText,
                                { color: colors.onAccent },
                                !canContinue && { color: colors.textSecondary },
                            ]}
                        >
                            {canContinue ? 'Kontynuuj' : 'Włącz zgodę, aby kontynuować'}
                        </Text>
                    </TouchableOpacity>
                    {!canContinue && (
                        <ThemedText
                            variant="bodySmall"
                            color="secondary"
                            style={{
                                textAlign: 'center',
                                marginTop: DesignSystem.spacing.md
                            }}
                        >
                            Akceptacja analizy notatek jest wymagana do działania aplikacji
                        </ThemedText>
                    )}
                </View>
            </ModernView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    primaryAction: {
        minHeight: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.16,
        shadowRadius: 10,
        elevation: 4,
    },
    primaryActionDisabled: {
        borderWidth: 1,
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryActionText: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
});
