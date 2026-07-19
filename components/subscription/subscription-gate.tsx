import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useThemeColor } from '../../hooks/use-theme-color';
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
    const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor({}, 'background');
    const cardBackground = useThemeColor({}, 'cardBackground');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const errorColor = useThemeColor({}, 'error');
    const primaryColor = useThemeColor({}, 'primary');
    const onAccentColor = useThemeColor({}, 'onAccent');

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
                <View style={[styles.paywallContainer, { backgroundColor }]}>
                    <View style={[styles.paywallContent, { backgroundColor: cardBackground }]}>
                        <Text style={[styles.paywallTitle, { color: textColor }]}>Funkcja Premium</Text>
                        <Text style={[styles.paywallMessage, { color: textSecondary }]}>
                            {screenTitle} jest dostępny tylko w planie Pro
                        </Text>

                        {isTrialExpired && (
                            <Text style={[styles.trialExpiredText, { color: errorColor, backgroundColor: colorScheme === 'dark' ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)' }]}>
                                Twój trial wygasł. Przejdź na plan Pro, aby kontynuować korzystanie z premium funkcji.
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[styles.upgradeButton, { backgroundColor: primaryColor }]}
                            onPress={() => setShowSubscriptionModal(true)}
                        >
                            <Text style={[styles.upgradeButtonText, { color: onAccentColor }]}>
                                Przejdź na Pro
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.featuresTitle, { color: textColor }]}>Co zyskujesz z planem Pro:</Text>
                        <View style={styles.featuresList}>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Nieograniczony dostęp do AI asystenta</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Zaawansowane analityki zdrowia</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Monitoring snu z AI</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Eksport danych w każdym formacie</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Personalizowane rekomendacje</Text>
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
            <View style={[styles.loadingContainer, { backgroundColor }]}>
                <Text style={[styles.loadingText, { color: textSecondary }]}>Sprawdzam dostęp...</Text>
            </View>
        );
    }

    // User has access - render children
    return <>{children}</>;
};

const styles = StyleSheet.create({
    paywallContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    paywallContent: {
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
        marginBottom: 15,
        textAlign: 'center',
    },
    paywallMessage: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    trialExpiredText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        padding: 15,
        borderRadius: 12,
        lineHeight: 22,
    },
    upgradeButton: {
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 25,
        marginBottom: 30,
    },
    upgradeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    featuresTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    featuresList: {
        width: '100%',
    },
    featureItem: {
        fontSize: 16,
        marginBottom: 8,
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },
});
