import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { PaymentResult, paymentService } from '../../lib/services/payment';

export interface PaymentMethodSelectProps {
    onPaymentMethodSelect: (paymentMethod: string) => void;
    amount: number;
    currency: string;
    description?: string;
    isLoading?: boolean;
}

export const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({
    onPaymentMethodSelect,
    amount,
    currency,
    description,
    isLoading = false
}) => {
    const [supportedMethods, setSupportedMethods] = useState<string[]>([]);
    const [processingMethod, setProcessingMethod] = useState<string | null>(null);

    useEffect(() => {
        loadSupportedMethods();
    }, []);

    const loadSupportedMethods = async () => {
        try {
            const methods = await paymentService.getSupportedPaymentMethods();
            setSupportedMethods(methods);
        } catch (error) {
            console.error('Failed to load payment methods:', error);
        }
    };

    const handlePaymentMethodPress = async (method: string) => {
        if (isLoading || processingMethod) return;

        setProcessingMethod(method);

        try {
            let result: PaymentResult;

            switch (method) {
                case 'apple_pay':
                    result = await paymentService.processApplePay({
                        amount,
                        currency,
                        description
                    });
                    break;

                case 'google_pay':
                    result = await paymentService.processGooglePay({
                        amount,
                        currency,
                        description
                    });
                    break;

                case 'card':
                    // For card payments, we'll use the payment sheet
                    onPaymentMethodSelect('card');
                    return;

                default:
                    throw new Error(`Unsupported payment method: ${method}`);
            }

            if (result.success && result.paymentMethod) {
                onPaymentMethodSelect(result.paymentMethod.id);
            } else {
                Alert.alert('Błąd płatności', result.error || 'Nieznany błąd');
            }
        } catch (error) {
            Alert.alert('Błąd', (error instanceof Error ? error.message : 'Wystąpił błąd podczas przetwarzania płatności'));
        } finally {
            setProcessingMethod(null);
        }
    };

    const getPaymentMethodInfo = (method: string) => {
        switch (method) {
            case 'card':
                return {
                    title: 'Karta płatnicza',
                    subtitle: 'Visa, Mastercard, Amex',
                    icon: 'card-outline' as const,
                    available: true
                };
            case 'apple_pay':
                return {
                    title: 'Apple Pay',
                    subtitle: 'Bezpieczne płatności',
                    icon: 'logo-apple' as const,
                    available: Platform.OS === 'ios'
                };
            case 'google_pay':
                return {
                    title: 'Google Pay',
                    subtitle: 'Szybkie płatności',
                    icon: 'logo-google' as const,
                    available: Platform.OS === 'android'
                };
            default:
                return {
                    title: method,
                    subtitle: '',
                    icon: 'card-outline' as const,
                    available: false
                };
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wybierz metodę płatności</Text>
            <Text style={styles.amount}>
                {(amount / 100).toFixed(2)} {currency.toUpperCase()}
            </Text>

            <View style={styles.methodsList}>
                {supportedMethods.map((method) => {
                    const methodInfo = getPaymentMethodInfo(method);
                    const isProcessing = processingMethod === method;
                    const isDisabled = isLoading || processingMethod !== null;

                    if (!methodInfo.available) return null;

                    return (
                        <TouchableOpacity
                            key={method}
                            style={[
                                styles.methodButton,
                                isDisabled && styles.methodButtonDisabled
                            ]}
                            onPress={() => handlePaymentMethodPress(method)}
                            disabled={isDisabled}
                        >
                            <View style={styles.methodContent}>
                                <View style={styles.methodIcon}>
                                    <Ionicons
                                        name={methodInfo.icon}
                                        size={24}
                                        color={Colors.light.text}
                                    />
                                </View>
                                <View style={styles.methodText}>
                                    <Text style={styles.methodTitle}>
                                        {methodInfo.title}
                                    </Text>
                                    <Text style={styles.methodSubtitle}>
                                        {methodInfo.subtitle}
                                    </Text>
                                </View>
                                <View style={styles.methodAction}>
                                    {isProcessing ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={Colors.light.primary}
                                        />
                                    ) : (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={Colors.light.tabIconDefault}
                                        />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.securityInfo}>
                <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={Colors.light.tabIconDefault}
                />
                <Text style={styles.securityText}>
                    Wszystkie płatności są szyfrowane i bezpieczne
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    amount: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.primary,
        textAlign: 'center',
        marginBottom: 24,
    },
    methodsList: {
        marginBottom: 24,
    },
    methodButton: {
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    methodButtonDisabled: {
        opacity: 0.6,
    },
    methodContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    methodIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    methodText: {
        flex: 1,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 2,
    },
    methodSubtitle: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
    },
    methodAction: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    securityText: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
        marginLeft: 8,
        textAlign: 'center',
    },
});