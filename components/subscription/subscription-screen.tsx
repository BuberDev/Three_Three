import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { SubscriptionPlan } from '../../lib/types/subscription';
import { useAppStore } from '../../stores/app-store';

interface SubscriptionScreenProps {
    onClose: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const {
        subscriptionStatus,
        availablePlans,
        loadSubscriptionStatus,
        loadAvailablePlans,
        createSubscription,
        startTrial
    } = useAppStore();

    // Format price from cents to main currency units (e.g., 3999 -> 39.99)
    const formatPrice = (priceInCents: number, currency: string): string => {
        const priceInMainUnits = priceInCents / 100;
        return priceInMainUnits.toFixed(2);
    };

    useEffect(() => {
        loadAvailablePlans();
        loadSubscriptionStatus();
    }, []);

    const handlePlanSelection = async (planId: string) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            if (planId === 'free_trial') {
                const success = await startTrial();
                if (success) {
                    Alert.alert('Sukces', 'Trial został aktywowany!', [
                        { text: 'OK', onPress: onClose }
                    ]);
                } else {
                    Alert.alert('Błąd', 'Nie udało się aktywować trial');
                }
            } else {
                // In production, integrate with payment system (Stripe, Apple Pay, etc.)
                const success = await createSubscription(planId);
                if (success) {
                    Alert.alert('Sukces', 'Subskrypcja została aktywowana!', [
                        { text: 'OK', onPress: onClose }
                    ]);
                } else {
                    Alert.alert('Błąd', 'Nie udało się aktywować subskrypcji');
                }
            }
        } catch (error) {
            Alert.alert('Błąd', 'Wystąpił błąd podczas przetwarzania');
        } finally {
            setIsLoading(false);
        }
    };

    const getPlanFeatures = (plan: SubscriptionPlan) => {
        const featureMap = {
            'basic_voice_notes': 'Podstawowe notatki głosowe',
            'unlimited_voice_notes': 'Nieograniczone notatki głosowe',
            'basic_sleep_tracking': 'Podstawowe śledzenie snu',
            'advanced_sleep_analysis': 'Zaawansowana analiza snu',
            'ai_insights': 'Wglądy AI',
            'correlation_analysis': 'Analiza korelacji',
            'behavioral_patterns': 'Wzorce behawioralne',
            'advanced_analytics': 'Zaawansowane analityki',
            'data_export': 'Eksport danych',
            'priority_support': 'Wsparcie priorytetowe'
        };

        return plan.features.map(feature => {
            if (typeof feature === 'string') {
                return featureMap[feature as keyof typeof featureMap] || feature;
            }
            return String(feature);
        });
    };

    const isCurrentPlan = (planId: string) => {
        return subscriptionStatus?.plan === planId;
    };

    const canSelectTrial = () => {
        console.log('🔍 Checking trial eligibility:', {
            hasSubscriptionStatus: !!subscriptionStatus,
            isOnTrial: subscriptionStatus?.isOnTrial,
            hasActiveSubscription: subscriptionStatus?.hasActiveSubscription,
            isPremiumUser: subscriptionStatus?.isPremiumUser,
            hasUsedTrial: subscriptionStatus?.hasUsedTrial,
            plan: subscriptionStatus?.plan,
            status: subscriptionStatus?.status
        });

        // User can select trial only if:
        // 1. No subscription status yet (new user), OR
        // 2. Has subscription status but never used trial before
        const canSelect = !subscriptionStatus ||
            (!subscriptionStatus.hasUsedTrial &&
                !subscriptionStatus.isOnTrial &&
                !subscriptionStatus.hasActiveSubscription &&
                !subscriptionStatus.isPremiumUser);

        console.log('🎯 Trial eligibility result:', canSelect);
        return canSelect;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wybierz Plan</Text>
                <View style={styles.spacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Status */}
                {subscriptionStatus && (
                    <View style={styles.statusCard}>
                        <Text style={styles.statusTitle}>Aktualny Status</Text>
                        {subscriptionStatus.isOnTrial ? (
                            <Text style={styles.statusText}>
                                Trial aktywny - {subscriptionStatus.daysRemaining} dni pozostało
                            </Text>
                        ) : subscriptionStatus.isPremiumUser ? (
                            <Text style={styles.statusText}>
                                Plan Pro aktywny
                            </Text>
                        ) : (
                            <Text style={styles.statusText}>
                                Brak aktywnej subskrypcji
                            </Text>
                        )}
                    </View>
                )}

                {/* Trial Option */}
                {canSelectTrial() && (
                    <View style={[styles.planCard, styles.trialCard]}>
                        <View style={styles.planHeader}>
                            <Text style={styles.planName}>7-dniowy Trial</Text>
                            <View style={styles.trialBadge}>
                                <Text style={styles.trialBadgeText}>DARMOWY</Text>
                            </View>
                        </View>
                        <Text style={styles.planPrice}>
                            0 zł <Text style={styles.priceUnit}>/ 7 dni</Text>
                        </Text>
                        <Text style={styles.planDescription}>
                            Przetestuj wszystkie funkcje przez 7 dni
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, styles.trialButton]}
                            onPress={() => handlePlanSelection('free_trial')}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.selectButtonText}>Rozpocznij Trial</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Available Plans */}
                {availablePlans && availablePlans.length > 0 ? (
                    availablePlans.map((plan) => (
                        <View
                            key={plan.id}
                            style={[
                                styles.planCard,
                                isCurrentPlan(plan.id) && styles.currentPlanCard
                            ]}
                        >
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                {plan.metadata?.popularBadge && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularBadgeText}>POPULARNE</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.planPrice}>
                                {formatPrice(plan.price, plan.currency)} {plan.currency.toUpperCase()}
                                <Text style={styles.priceUnit}> / {plan.interval === 'month' ? 'miesiąc' : 'rok'}</Text>
                            </Text>

                            {plan.description && (
                                <Text style={styles.planDescription}>{plan.description}</Text>
                            )}

                            <View style={styles.featuresContainer}>
                                {getPlanFeatures(plan).map((feature, index) => (
                                    <View key={index} style={styles.featureRow}>
                                        <Text style={styles.featureCheck}>✓</Text>
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            {isCurrentPlan(plan.id) ? (
                                <View style={styles.currentPlanButton}>
                                    <Text style={styles.currentPlanText}>Aktualny Plan</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.selectButton, styles.premiumButton]}
                                    onPress={() => handlePlanSelection(plan.id)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.selectButtonText}>
                                            Wybierz Plan
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Ładowanie planów...</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        • Anuluj w każdym momencie{'\n'}
                        • Bezpieczne płatności{'\n'}
                        • Wsparcie 24/7
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        fontSize: 18,
        color: Colors.light.text,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
        marginLeft: 16,
    },
    spacer: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    statusCard: {
        backgroundColor: Colors.light.surface,
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
    },
    planCard: {
        backgroundColor: Colors.light.surface,
        padding: 20,
        borderRadius: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    trialCard: {
        borderColor: '#F59E0B',
        backgroundColor: '#FFFBEB',
    },
    currentPlanCard: {
        borderColor: Colors.light.primary,
        backgroundColor: '#F0F9FF',
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    planName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    trialBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    trialBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    popularBadge: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    priceUnit: {
        fontSize: 14,
        fontWeight: '400',
        color: Colors.light.tabIconDefault,
    },
    planDescription: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        marginBottom: 16,
        lineHeight: 20,
    },
    featuresContainer: {
        marginBottom: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureCheck: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '700',
        marginRight: 8,
    },
    featureText: {
        fontSize: 14,
        color: Colors.light.text,
        flex: 1,
    },
    selectButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    trialButton: {
        backgroundColor: '#F59E0B',
    },
    premiumButton: {
        backgroundColor: Colors.light.primary,
    },
    selectButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    currentPlanButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: Colors.light.border,
    },
    currentPlanText: {
        color: Colors.light.tabIconDefault,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        marginTop: 20,
        marginBottom: 40,
    },
    footerText: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 18,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
});
