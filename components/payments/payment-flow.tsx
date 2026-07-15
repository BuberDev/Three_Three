import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { paymentService } from '../../lib/services/payment';
import { useAppStore } from '../../stores/app-store';
import { PaymentMethodSelect } from './payment-method-select';

export interface PaymentFlowProps {
    planId: string;
    planName: string;
    amount: number;
    currency: string;
    onSuccess: () => void;
    onCancel: () => void;
    visible: boolean;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
    planId,
    planName,
    amount,
    currency,
    onSuccess,
    onCancel,
    visible
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState<'method' | 'processing' | 'success'>('method');
    const [setupIntentData, setSetupIntentData] = useState<any>(null);

    const { createSubscription } = useAppStore();

    useEffect(() => {
        if (visible) {
            setCurrentStep('method');
            setSetupIntentData(null);
        }
    }, [visible]);

    const handlePaymentMethodSelect = async (paymentMethodId: string) => {
        setIsProcessing(true);
        setCurrentStep('processing');

        try {
            if (paymentMethodId === 'card') {
                // Handle card payment with payment sheet
                await handleCardPayment();
            } else {
                // Handle Apple Pay / Google Pay
                await handleWalletPayment(paymentMethodId);
            }
        } catch (error) {
            console.error('Payment failed:', error);
            Alert.alert('Błąd płatności', (error instanceof Error ? error.message : 'Wystąpił błąd podczas przetwarzania płatności'));
            setCurrentStep('method');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCardPayment = async () => {
        try {
            // Get setup intent from backend
            const response = await fetch(`${process.env.API_URL}/api/payments/stripe/setup-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useAppStore.getState().accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to create setup intent');
            }

            const { clientSecret, customerId } = await response.json();

            // Present payment sheet
            const result = await paymentService.presentPaymentSheet(clientSecret, customerId);

            if (result.success) {
                // Create subscription with Stripe
                const success = await createSubscription(planId);
                if (success) {
                    setCurrentStep('success');
                    setTimeout(() => {
                        onSuccess();
                    }, 2000);
                } else {
                    throw new Error('Failed to create subscription');
                }
            } else {
                throw new Error(result.error || 'Payment failed');
            }
        } catch (error) {
            throw error;
        }
    };

    const handleWalletPayment = async (paymentMethodId: string) => {
        try {
            // Create subscription with wallet payment method
            const success = await createSubscription(planId, paymentMethodId);

            if (success) {
                setCurrentStep('success');
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                throw new Error('Failed to create subscription');
            }
        } catch (error) {
            throw error;
        }
    };

    const renderMethodSelection = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Płatność</Text>
                <View style={styles.spacer} />
            </View>

            <View style={styles.planInfo}>
                <Text style={styles.planName}>{planName}</Text>
                <Text style={styles.planDescription}>
                    Miesięczna subskrypcja z pełnym dostępem
                </Text>
            </View>

            <PaymentMethodSelect
                amount={amount}
                currency={currency}
                description={`Subskrypcja ${planName}`}
                onPaymentMethodSelect={handlePaymentMethodSelect}
                isLoading={isProcessing}
            />

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Po zakupie subskrypcja odnowi się automatycznie.{'\n'}
                    Możesz anulować w każdym momencie.
                </Text>
            </View>
        </View>
    );

    const renderProcessing = () => (
        <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.processingText}>Przetwarzanie płatności...</Text>
            <Text style={styles.processingSubtext}>
                Może to potrwać kilka sekund
            </Text>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.successContainer}>
            <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Płatność pomyślna!</Text>
            <Text style={styles.successText}>
                Twoja subskrypcja {planName} została aktywowana.
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onCancel}
        >
            <SafeAreaView style={styles.modalContainer}>
                {currentStep === 'method' && renderMethodSelection()}
                {currentStep === 'processing' && renderProcessing()}
                {currentStep === 'success' && renderSuccess()}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
        marginLeft: 16,
    },
    spacer: {
        flex: 1,
    },
    planInfo: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    planName: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    planDescription: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 18,
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    processingText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 24,
        textAlign: 'center',
    },
    processingSubtext: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        marginTop: 8,
        textAlign: 'center',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successIcon: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 24,
    },
});