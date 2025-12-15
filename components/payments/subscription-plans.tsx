import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useAppStore } from '../../stores/app-store';
import { PaymentFlow } from './payment-flow';
import { PaymentMethodManager } from './payment-method-manager';

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
    recommended?: boolean;
    stripePriceId: string;
}

export interface SubscriptionPlansProps {
    plans: SubscriptionPlan[];
    currentPlanId?: string;
    onPlanSelect?: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
    plans,
    currentPlanId,
    onPlanSelect
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [showPaymentFlow, setShowPaymentFlow] = useState(false);
    const [showPaymentMethods, setShowPaymentMethods] = useState(false);
    const [userSubscription, setUserSubscription] = useState<any>(null);

    const { accessToken, subscription } = useAppStore();

    useEffect(() => {
        setUserSubscription(subscription);
    }, [subscription]);

    const formatPrice = (price: number, currency: string, interval: string) => {
        const formattedPrice = new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(price / 100);

        const intervalText = interval === 'month' ? 'miesięcznie' : 'rocznie';
        return `${formattedPrice} ${intervalText}`;
    };

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        if (plan.id === currentPlanId) {
            return; // Already subscribed to this plan
        }

        setSelectedPlan(plan);
        setShowPaymentFlow(true);

        if (onPlanSelect) {
            onPlanSelect(plan);
        }
    };

    const handleCancelSubscription = async () => {
        Alert.alert(
            'Anuluj subskrypcję',
            'Czy na pewno chcesz anulować swoją subskrypcję? Dostęp do funkcji premium zostanie utracony na koniec bieżącego okresu rozliczeniowego.',
            [
                { text: 'Nie', style: 'cancel' },
                {
                    text: 'Anuluj subskrypcję',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await fetch(
                                `${process.env.EXPO_PUBLIC_API_URL}/api/subscriptions/cancel`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                    },
                                }
                            );

                            if (response.ok) {
                                Alert.alert('Sukces', 'Subskrypcja została anulowana');
                                // Refresh subscription state
                                useAppStore.getState().refreshUser();
                            } else {
                                throw new Error('Failed to cancel subscription');
                            }
                        } catch (error) {
                            console.error('Failed to cancel subscription:', error);
                            Alert.alert('Błąd', 'Nie udało się anulować subskrypcji');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePaymentSuccess = () => {
        setShowPaymentFlow(false);
        setSelectedPlan(null);

        // Refresh user data to get updated subscription
        useAppStore.getState().refreshUser();

        Alert.alert(
            'Subskrypcja aktywowana!',
            'Dziękujemy za zakup. Twoja subskrypcja została pomyślnie aktywowana.',
            [{ text: 'OK' }]
        );
    };

    const renderPlanFeature = (feature: string, index: number) => (
        <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.featureText}>{feature}</Text>
        </View>
    );

    const renderPlan = ({ item }: { item: SubscriptionPlan }) => {
        const isCurrentPlan = item.id === currentPlanId;
        const isRecommended = item.recommended;

        return (
            <View style={[
                styles.planCard,
                isRecommended && styles.recommendedPlan,
                isCurrentPlan && styles.currentPlan
            ]}>
                {isRecommended && (
                    <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Polecane</Text>
                    </View>
                )}

                <View style={styles.planHeader}>
                    <Text style={styles.planName}>{item.name}</Text>
                    <Text style={styles.planDescription}>{item.description}</Text>
                </View>

                <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>
                        {formatPrice(item.price, item.currency, item.interval)}
                    </Text>
                </View>

                <View style={styles.planFeatures}>
                    {item.features.map(renderPlanFeature)}
                </View>

                <View style={styles.planActions}>
                    {isCurrentPlan ? (
                        <View>
                            <TouchableOpacity style={styles.currentPlanButton} disabled>
                                <Text style={styles.currentPlanText}>Aktywny plan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.manageButton}
                                onPress={() => setShowPaymentMethods(true)}
                            >
                                <Text style={styles.manageButtonText}>Zarządzaj płatnościami</Text>
                            </TouchableOpacity>
                            {userSubscription && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={handleCancelSubscription}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <Text style={styles.cancelButtonText}>Anuluj subskrypcję</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.selectButton,
                                isRecommended && styles.recommendedButton
                            ]}
                            onPress={() => handleSelectPlan(item)}
                        >
                            <Text style={[
                                styles.selectButtonText,
                                isRecommended && styles.recommendedButtonText
                            ]}>
                                Wybierz plan
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Plany subskrypcji</Text>
                <Text style={styles.headerSubtitle}>
                    Wybierz plan, który najlepiej odpowiada Twoim potrzebom
                </Text>
            </View>

            <FlatList
                data={plans}
                keyExtractor={(item) => item.id}
                renderItem={renderPlan}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            {selectedPlan && (
                <PaymentFlow
                    visible={showPaymentFlow}
                    planId={selectedPlan.stripePriceId}
                    planName={selectedPlan.name}
                    amount={selectedPlan.price}
                    currency={selectedPlan.currency}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                        setShowPaymentFlow(false);
                        setSelectedPlan(null);
                    }}
                />
            )}

            <PaymentMethodManager
                visible={showPaymentMethods}
                onClose={() => setShowPaymentMethods(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
        paddingTop: 0,
    },
    planCard: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    recommendedPlan: {
        borderColor: Colors.light.primary,
    },
    currentPlan: {
        borderColor: '#10B981',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -8,
        left: 20,
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    planHeader: {
        marginBottom: 16,
    },
    planName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
    },
    planPricing: {
        marginBottom: 20,
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.text,
    },
    planFeatures: {
        marginBottom: 24,
        gap: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        color: Colors.light.text,
        flex: 1,
    },
    planActions: {
        gap: 8,
    },
    selectButton: {
        backgroundColor: Colors.light.background,
        borderWidth: 2,
        borderColor: Colors.light.primary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    recommendedButton: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    selectButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    recommendedButtonText: {
        color: 'white',
    },
    currentPlanButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 8,
    },
    currentPlanText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    manageButton: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 8,
    },
    manageButtonText: {
        fontSize: 14,
        color: Colors.light.text,
    },
    cancelButton: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#EF4444',
    },
});