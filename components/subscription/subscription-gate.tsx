import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAppStore } from '../../stores/app-store';
import { SubscriptionScreen } from './subscription-screen';

interface SubscriptionGateProps {
    feature: 'start_screen' | 'ai_chat' | 'voice_notes' | 'sleep_screen' | 'analytics' | 'premium_exports' | 'routines_screen';
    children: React.ReactNode;
    screenTitle: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
    feature,
    children,
    screenTitle
}) => {
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const { subscriptionStatus, loadSubscriptionStatus } = useAppStore();

    useEffect(() => {
        loadSubscriptionStatus();
    }, []);

    // Check if user has access to this feature
    const hasAccess = subscriptionStatus?.isPremiumUser || subscriptionStatus?.isOnTrial;
    const isTrialExpired = subscriptionStatus && !subscriptionStatus.isOnTrial && !subscriptionStatus.isPremiumUser;

    // Show paywall if no access
    if (!hasAccess && subscriptionStatus !== null) {
        return (
            <>
                <View style={styles.paywallContainer}>
                    <View style={styles.paywallContent}>
                        <Text style={styles.paywallTitle}>🔒 Funkcja Premium</Text>
                        <Text style={styles.paywallMessage}>
                            {screenTitle} jest dostępny tylko w planie Pro
                        </Text>

                        {isTrialExpired && (
                            <Text style={styles.trialExpiredText}>
                                Twój trial wygasł. Przejdź na plan Pro, aby kontynuować korzystanie z premium funkcji.
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.upgradeButton}
                            onPress={() => setShowSubscriptionModal(true)}
                        >
                            <Text style={styles.upgradeButtonText}>
                                Przejdź na Pro
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.featuresTitle}>Co zyskujesz z planem Pro:</Text>
                        <View style={styles.featuresList}>
                            <Text style={styles.featureItem}>✅ Nieograniczony dostęp do AI asystenta</Text>
                            <Text style={styles.featureItem}>✅ Zaawansowane analityki zdrowia</Text>
                            <Text style={styles.featureItem}>✅ Monitoring snu z AI</Text>
                            <Text style={styles.featureItem}>✅ Eksport danych w każdym formacie</Text>
                            <Text style={styles.featureItem}>✅ Personalizowane rekomendacje</Text>
                        </View>
                    </View>
                </View>

                <Modal
                    visible={showSubscriptionModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <SubscriptionScreen
                        onClose={() => setShowSubscriptionModal(false)}
                    />
                </Modal>
            </>
        );
    }

    // Show loading state while checking subscription
    if (subscriptionStatus === null) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Sprawdzam dostęp...</Text>
            </View>
        );
    }

    // User has access - render children
    return <>{children}</>;
};

const styles = StyleSheet.create({
    paywallContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    paywallContent: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        maxWidth: '100%',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    paywallTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
        textAlign: 'center',
    },
    paywallMessage: {
        fontSize: 18,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    trialExpiredText: {
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 25,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        padding: 15,
        borderRadius: 12,
        lineHeight: 22,
    },
    upgradeButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 25,
        marginBottom: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    upgradeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    featuresTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 15,
        textAlign: 'center',
    },
    featuresList: {
        width: '100%',
    },
    featureItem: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 8,
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
});