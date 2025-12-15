import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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

export interface PaymentMethod {
    id: string;
    type: 'card' | 'apple_pay' | 'google_pay';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
}

export interface PaymentMethodManagerProps {
    visible: boolean;
    onClose: () => void;
    onPaymentMethodSelect?: (paymentMethodId: string) => void;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
    visible,
    onClose,
    onPaymentMethodSelect
}) => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingMethod, setIsAddingMethod] = useState(false);

    const { accessToken } = useAppStore();

    useEffect(() => {
        if (visible) {
            loadPaymentMethods();
        }
    }, [visible]);

    const loadPaymentMethods = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payments/methods`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const methods = await response.json();
                setPaymentMethods(methods);
            }
        } catch (error) {
            console.error('Failed to load payment methods:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPaymentMethod = async () => {
        setIsAddingMethod(true);
        try {
            // Get setup intent from backend
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payments/stripe/setup-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to create setup intent');
            }

            const { clientSecret, customerId } = await response.json();

            // Present payment sheet for setup
            const result = await paymentService.presentPaymentSheet(clientSecret, customerId);

            if (result.success) {
                await loadPaymentMethods(); // Reload methods
            } else {
                Alert.alert('Błąd', result.error || 'Nie udało się dodać metody płatności');
            }
        } catch (error) {
            console.error('Failed to add payment method:', error);
            Alert.alert('Błąd', 'Wystąpił błąd podczas dodawania metody płatności');
        } finally {
            setIsAddingMethod(false);
        }
    };

    const handleDeletePaymentMethod = async (paymentMethodId: string) => {
        Alert.alert(
            'Usuń metodę płatności',
            'Czy na pewno chcesz usunąć tę metodę płatności?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(
                                `${process.env.EXPO_PUBLIC_API_URL}/api/payments/methods/${paymentMethodId}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                    },
                                }
                            );

                            if (response.ok) {
                                await loadPaymentMethods();
                            } else {
                                throw new Error('Failed to delete payment method');
                            }
                        } catch (error) {
                            console.error('Failed to delete payment method:', error);
                            Alert.alert('Błąd', 'Nie udało się usunąć metody płatności');
                        }
                    }
                }
            ]
        );
    };

    const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/payments/methods/${paymentMethodId}/set-default`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.ok) {
                await loadPaymentMethods();
            } else {
                throw new Error('Failed to set default payment method');
            }
        } catch (error) {
            console.error('Failed to set default payment method:', error);
            Alert.alert('Błąd', 'Nie udało się ustawić domyślnej metody płatności');
        }
    };

    const getPaymentMethodIcon = (type: string, brand?: string) => {
        switch (type) {
            case 'apple_pay':
                return 'logo-apple';
            case 'google_pay':
                return 'logo-google';
            case 'card':
                switch (brand?.toLowerCase()) {
                    case 'visa':
                        return 'card';
                    case 'mastercard':
                        return 'card';
                    case 'amex':
                        return 'card';
                    default:
                        return 'card-outline';
                }
            default:
                return 'card-outline';
        }
    };

    const getPaymentMethodLabel = (method: PaymentMethod) => {
        switch (method.type) {
            case 'apple_pay':
                return 'Apple Pay';
            case 'google_pay':
                return 'Google Pay';
            case 'card':
                const brandName = method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Karta';
                return `${brandName} •••• ${method.last4}`;
            default:
                return 'Nieznana metoda';
        }
    };

    const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
        <View style={styles.paymentMethodItem}>
            <TouchableOpacity
                style={styles.paymentMethodContent}
                onPress={() => {
                    if (onPaymentMethodSelect) {
                        onPaymentMethodSelect(item.id);
                        onClose();
                    }
                }}
            >
                <View style={styles.paymentMethodLeft}>
                    <Ionicons
                        name={getPaymentMethodIcon(item.type, item.brand) as any}
                        size={24}
                        color={Colors.light.text}
                    />
                    <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodLabel}>
                            {getPaymentMethodLabel(item)}
                        </Text>
                        {item.expiryMonth && item.expiryYear && (
                            <Text style={styles.paymentMethodExpiry}>
                                Ważna do {item.expiryMonth.toString().padStart(2, '0')}/{item.expiryYear}
                            </Text>
                        )}
                        {item.isDefault && (
                            <Text style={styles.defaultLabel}>Domyślna</Text>
                        )}
                    </View>
                </View>
                <View style={styles.paymentMethodActions}>
                    {!item.isDefault && (
                        <TouchableOpacity
                            onPress={() => handleSetDefaultPaymentMethod(item.id)}
                            style={styles.actionButton}
                        >
                            <Text style={styles.setDefaultText}>Ustaw jako domyślną</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => handleDeletePaymentMethod(item.id)}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Metody płatności</Text>
                    <TouchableOpacity
                        onPress={handleAddPaymentMethod}
                        style={styles.addButton}
                        disabled={isAddingMethod}
                    >
                        {isAddingMethod ? (
                            <ActivityIndicator size="small" color={Colors.light.primary} />
                        ) : (
                            <Ionicons name="add" size={24} color={Colors.light.primary} />
                        )}
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.light.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={paymentMethods}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPaymentMethod}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="card-outline" size={48} color={Colors.light.tabIconDefault} />
                                <Text style={styles.emptyTitle}>Brak metod płatności</Text>
                                <Text style={styles.emptyText}>
                                    Dodaj kartę lub inną metodę płatności, aby dokonywać zakupów
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </Modal>
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
        justifyContent: 'space-between',
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
    },
    addButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    paymentMethodItem: {
        marginBottom: 12,
        backgroundColor: Colors.light.cardBackground,
        borderRadius: 12,
        overflow: 'hidden',
    },
    paymentMethodContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentMethodInfo: {
        marginLeft: 12,
        flex: 1,
    },
    paymentMethodLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.text,
    },
    paymentMethodExpiry: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        marginTop: 2,
    },
    defaultLabel: {
        fontSize: 12,
        color: Colors.light.primary,
        fontWeight: '500',
        marginTop: 4,
    },
    paymentMethodActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.light.background,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    setDefaultText: {
        fontSize: 12,
        color: Colors.light.text,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 40,
    },
});