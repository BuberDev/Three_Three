import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
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
            colors={[Colors.light.primary, Colors.light.primaryLight] as readonly [string, string, ...string[]]}
            locations={[0, 1] as readonly [number, number, ...number[]]}
            start={DesignSystem.gradients.primary.start}
            end={DesignSystem.gradients.primary.end}
            style={{
                flex: 1,
                paddingTop: insets.top,
                paddingBottom: insets.bottom
            }}
        >
            <View style={{
                flex: 1,
                paddingHorizontal: DesignSystem.spacing.xl,
                justifyContent: 'space-between',
            }}>
                {/* Main Content */}
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: DesignSystem.borderRadius.full,
                        padding: DesignSystem.spacing['3xl'],
                        marginBottom: DesignSystem.spacing['4xl'],
                        ...DesignSystem.elevation[2],
                    }}>
                        <IconSymbol
                            name="chart.line.uptrend.xyaxis"
                            size={80}
                            color="white"
                        />
                    </View>

                    <ThemedText
                        variant="displaySmall"
                        lightColor="white"
                        darkColor="white"
                        style={{
                            textAlign: 'center',
                            marginBottom: DesignSystem.spacing.xl,
                            fontWeight: '700',
                        }}
                    >
                        Zwieksz swoj performance zyciowy
                    </ThemedText>

                    <ThemedText
                        variant="bodyLarge"
                        lightColor="rgba(255,255,255,0.9)"
                        darkColor="rgba(255,255,255,0.9)"
                        style={{
                            textAlign: 'center',
                            marginBottom: DesignSystem.spacing['3xl'],
                            lineHeight: 26,
                        }}
                    >
                        Analizuj zycie ze wsparciem AI i podejmuj lepsze decyzje kazdego dnia.
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
                                Analiza swojego zycia
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
                                Rekomendacje dzialan
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
                    paddingBottom: DesignSystem.spacing.lg,
                    alignItems: 'center',
                }}>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: DesignSystem.borderRadius.xl,
                        padding: 2,
                        marginBottom: DesignSystem.spacing.lg,
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

                    <ThemedText
                        variant="bodySmall"
                        lightColor="rgba(255,255,255,0.7)"
                        darkColor="rgba(255,255,255,0.7)"
                        style={{
                            textAlign: 'center',
                            lineHeight: 18,
                        }}
                    >
                        Rozpoczęcie zajmuje mniej niż 2 minuty
                    </ThemedText>
                </View>
            </View>
        </LinearGradient>
    );
};