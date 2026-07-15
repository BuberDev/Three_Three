import { Colors } from '@/constants/theme';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { useAppStore } from '@/stores/app-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'premium',
        name: 'Premium',
        description: 'Kompleksowe zarządzanie zdrowiem z AI',
        price: 3999, // 39.99 PLN in cents
        currency: 'pln',
        interval: 'month',
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
        recommended: true,
        features: [
            'AI asystent zdrowia 24/7',
            'Personalizowane rekomendacje',
            'Zaawansowane analityki',
            'Śledzenie snu z AI',
            'Notatki głosowe bez limitu',
            'Integracje z urządzeniami',
            'Priority support',
            'Wszystkie przyszłe funkcje'
        ],
    },
    {
        id: 'premium-yearly',
        name: 'Premium Roczny',
        description: 'Premium z rabatem rocznym - oszczędzasz 20%',
        price: 38390, // 383.90 PLN in cents (equivalent to ~31.99/month)
        currency: 'pln',
        interval: 'year',
        stripePriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
        features: [
            'Wszystko z planu Premium',
            'Oszczędność 20% w stosunku do planu miesięcznego',
            'Roczne raporty zdrowotne',
            'Dedykowany account manager',
            'Wczesny dostęp do nowych funkcji'
        ],
    },
];

// SubscriptionPlans component
interface SubscriptionPlansProps {
    plans: SubscriptionPlan[];
    currentPlanId: string | null;
    onPlanSelect: (plan: SubscriptionPlan) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ plans, currentPlanId, onPlanSelect }) => {
    return (
        <View style={styles.plansContainer}>
            {plans.map((plan) => (
                <TouchableOpacity
                    key={plan.id}
                    style={[
                        styles.planCard,
                        currentPlanId === plan.id && styles.activePlan,
                        plan.recommended && styles.recommendedPlan
                    ]}
                    onPress={() => onPlanSelect(plan)}
                >
                    {plan.recommended && (
                        <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>Polecane</Text>
                        </View>
                    )}
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                    <Text style={styles.planPrice}>
                        {(plan.price / 100).toFixed(2)} {plan.currency.toUpperCase()}
                        /{plan.interval === 'month' ? 'miesiąc' : 'rok'}
                    </Text>
                    <View style={styles.featuresContainer}>
                        {plan.features.map((feature, index) => (
                            <Text key={index} style={styles.featureText}>
                                • {feature}
                            </Text>
                        ))}
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export const SubscriptionScreen: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);

    const { subscription, refreshUser } = useAppStore();

    useEffect(() => {
        // Filter out plans that don't have valid Stripe price IDs
        const validPlans = SUBSCRIPTION_PLANS.filter(plan => plan.stripePriceId);
        setPlans(validPlans);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser();
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            Alert.alert('Błąd', 'Nie udało się odświeżyć danych');
        } finally {
            setIsRefreshing(false);
        }
    };

    const getCurrentPlanId = () => {
        if (!subscription?.active) return undefined;

        // Map Stripe price IDs to plan IDs
        const priceIdToPlanId = {
            [process.env.STRIPE_PREMIUM_PRICE_ID || '']: 'premium',
            [process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '']: 'premium-yearly',
        };

        return priceIdToPlanId[subscription.stripePriceId] || undefined;
    };

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        // Additional logic for plan selection if needed
        console.log('Selected plan:', plan.name);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.light.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Subskrypcja</Text>
                    <Text style={styles.subtitle}>
                        Zarządzaj swoim planem i metodami płatności
                    </Text>
                </View>

                {subscription?.active && (
                    <View style={styles.currentSubscriptionCard}>
                        <Text style={styles.currentSubscriptionTitle}>
                            Twoja subskrypcja
                        </Text>
                        <Text style={styles.currentSubscriptionPlan}>
                            {subscription.planName || 'Plan Premium'}
                        </Text>
                        <Text style={styles.currentSubscriptionStatus}>
                            Aktywna do: {subscription.currentPeriodEnd ?
                                new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL') :
                                'Nieznana data'
                            }
                        </Text>
                        {subscription.cancelAtPeriodEnd && (
                            <View style={styles.cancellationNotice}>
                                <Text style={styles.cancellationText}>
                                    ⚠️ Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <SubscriptionPlans
                    plans={plans}
                    currentPlanId={getCurrentPlanId() || null}
                    onPlanSelect={handlePlanSelect}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        • Anuluj w każdym momencie{'\n'}
                        • Bezpieczne płatności przez Stripe{'\n'}
                        • Automatyczne odnawianie subskrypcji{'\n'}
                        • Support 24/7 dla planów Premium
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
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
    },
    currentSubscriptionCard: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    currentSubscriptionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.tabIconDefault,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    currentSubscriptionPlan: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    currentSubscriptionStatus: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
    },
    cancellationNotice: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    cancellationText: {
        fontSize: 14,
        color: '#92400E',
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        lineHeight: 20,
        textAlign: 'center',
    },
    plansContainer: {
        marginHorizontal: 16,
    },
    planCard: {
        backgroundColor: Colors.light.cardBackground,
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activePlan: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    recommendedPlan: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -8,
        right: 16,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    planName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    planDescription: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        marginBottom: 12,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 16,
    },
    featuresContainer: {
        marginTop: 8,
    },
    featureText: {
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 4,
    },
});

// Default export required by Expo Router
export default SubscriptionScreen;