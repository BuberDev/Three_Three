import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ModernView } from '../modern-view';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface IntroScreenProps {
    onContinue: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onContinue }) => {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <LinearGradient
            colors={[colors.primary, colors.primaryLight] as [string, string]}
            locations={[0, 1] as [number, number]}
            start={DesignSystem.gradients.primary.start}
            end={DesignSystem.gradients.primary.end}
            style={{
                flex: 1,
            }}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + DesignSystem.spacing.lg,
                    paddingBottom: insets.bottom + 72,
                    paddingHorizontal: DesignSystem.spacing.xl,
                }}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Content */}
                <View style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: DesignSystem.spacing.lg,
                }}>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: DesignSystem.borderRadius.full,
                        padding: DesignSystem.spacing['2xl'],
                        marginBottom: DesignSystem.spacing.xl,
                        ...DesignSystem.elevation[2],
                    }}>
                        <IconSymbol
                            name="chart.line.uptrend.xyaxis"
                            size={50}
                            color="white"
                        />
                    </View>

                    <ThemedText
                        variant="displaySmall"
                        lightColor="white"
                        darkColor="white"
                        style={{
                            textAlign: 'center',
                            marginBottom: DesignSystem.spacing.lg,
                            fontWeight: '700',
                        }}
                    >
                        Zwiększ swój performance życiowy
                    </ThemedText>

                    <ThemedText
                        variant="bodyLarge"
                        lightColor="rgba(255,255,255,0.9)"
                        darkColor="rgba(255,255,255,0.9)"
                        style={{
                            textAlign: 'center',
                            marginBottom: DesignSystem.spacing['2xl'],
                            lineHeight: 26,
                        }}
                    >
                        Analizuj życie ze wsparciem AI i podejmuj lepsze decyzje każdego dnia.
                    </ThemedText>

                    <View style={{
                        width: '100%',
                        gap: DesignSystem.spacing.lg,
                    }}>
                        <ModernView
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: DesignSystem.spacing.md,
                                borderRadius: DesignSystem.borderRadius.xl,
                                gap: DesignSystem.spacing.lg,
                            }}
                        >
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: DesignSystem.borderRadius.lg,
                                padding: DesignSystem.spacing.md,
                            }}>
                                <IconSymbol name="bolt.fill" size={24} color="white" />
                            </View>
                            <ThemedText
                                variant="titleMedium"
                                lightColor="white"
                                darkColor="white"
                                style={{ flex: 1, fontWeight: '600' }}
                            >
                                Analiza swojego życia
                            </ThemedText>
                        </ModernView>

                        <ModernView
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: DesignSystem.spacing.md,
                                borderRadius: DesignSystem.borderRadius.xl,
                                gap: DesignSystem.spacing.lg,
                            }}
                        >
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: DesignSystem.borderRadius.lg,
                                padding: DesignSystem.spacing.md,
                            }}>
                                <IconSymbol name="list.bullet.clipboard" size={24} color="white" />
                            </View>
                            <ThemedText
                                variant="titleMedium"
                                lightColor="white"
                                darkColor="white"
                                style={{ flex: 1, fontWeight: '600' }}
                            >
                                Rekomendacje działań
                            </ThemedText>
                        </ModernView>

                        <ModernView
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: DesignSystem.spacing.md,
                                borderRadius: DesignSystem.borderRadius.xl,
                                gap: DesignSystem.spacing.lg,
                            }}
                        >
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: DesignSystem.borderRadius.lg,
                                padding: DesignSystem.spacing.md,
                            }}>
                                <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color="white" />
                            </View>
                            <ThemedText
                                variant="titleMedium"
                                lightColor="white"
                                darkColor="white"
                                style={{ flex: 1, fontWeight: '600' }}
                            >
                                Najlepsze decyzje
                            </ThemedText>
                        </ModernView>
                    </View>
                </View>

                {/* Bottom Button Section */}
                <View style={{
                    flexShrink: 0, // Prevent shrinking
                    marginTop: DesignSystem.spacing.xl,
                    alignItems: 'center',
                }}>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: DesignSystem.borderRadius.xl,
                        padding: 2,
                        marginBottom: DesignSystem.spacing.md,
                        width: '100%',
                    }}>
                        <TouchableOpacity
                            onPress={onContinue}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: DesignSystem.borderRadius.lg,
                                paddingVertical: DesignSystem.spacing.lg,
                                paddingHorizontal: DesignSystem.spacing.xl,
                                alignItems: 'center',
                                ...DesignSystem.elevation[2],
                            }}
                        >
                            <ThemedText
                                variant="titleMedium"
                                style={{
                                    color: colors.primary,
                                    fontWeight: '600',
                                }}
                            >
                                Rozpocznij
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};
