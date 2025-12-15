import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { SubscriptionStatus } from '../../lib/types/subscription';
import { useAppStore } from '../../stores/app-store';

interface SubscriptionBannerProps {
    subscriptionStatus: SubscriptionStatus;
    onUpgrade: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
    subscriptionStatus,
    onUpgrade
}) => {
    if (!subscriptionStatus || subscriptionStatus.isPremiumUser) {
        return null;
    }

    const { isOnTrial, daysRemaining } = subscriptionStatus;

    if (isOnTrial) {
        return (
            <View style={[styles.banner, styles.trialBanner]}>
                <View style={styles.content}>
                    <Text style={styles.title}>
                        Trial aktywny
                    </Text>
                    <Text style={styles.subtitle}>
                        {daysRemaining} dni pozostało
                    </Text>
                </View>
                <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                    <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.banner, styles.expiredBanner]}>
            <View style={styles.content}>
                <Text style={styles.title}>
                    Trial wygasł
                </Text>
                <Text style={styles.subtitle}>
                    Przejdź na plan Pro
                </Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
        </View>
    );
};

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onUpgrade?: () => void;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    children,
    fallback,
    onUpgrade
}) => {
    const hasAccess = useAppStore(state => state.hasFeatureAccess(feature as any));

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <View style={styles.paywallContainer}>
            <Text style={styles.paywallTitle}>Funkcja Premium</Text>
            <Text style={styles.paywallMessage}>
                Ta funkcja jest dostępna tylko w planie Pro
            </Text>
            {onUpgrade && (
                <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                    <Text style={styles.upgradeText}>Upgrade do Pro</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

interface UsageLimitProps {
    limitType: string;
    currentUsage: number;
    limit: number;
    onUpgrade?: () => void;
}

export const UsageLimitWarning: React.FC<UsageLimitProps> = ({
    limitType,
    currentUsage,
    limit,
    onUpgrade
}) => {
    const percentage = (currentUsage / limit) * 100;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    if (!isNearLimit) {
        return null;
    }

    return (
        <View style={[styles.banner, isAtLimit ? styles.errorBanner : styles.warningBanner]}>
            <View style={styles.content}>
                <Text style={styles.title}>
                    {isAtLimit ? 'Limit osiągnięty' : 'Blisko limitu'}
                </Text>
                <Text style={styles.subtitle}>
                    {currentUsage}/{limit} {limitType}
                </Text>
            </View>
            {onUpgrade && (
                <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                    <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    trialBanner: {
        backgroundColor: '#FEF3C7', // yellow-100
        borderColor: '#F59E0B', // yellow-500
        borderWidth: 1,
    },
    expiredBanner: {
        backgroundColor: '#FEE2E2', // red-100
        borderColor: '#EF4444', // red-500
        borderWidth: 1,
    },
    warningBanner: {
        backgroundColor: '#FED7AA', // orange-100
        borderColor: '#F97316', // orange-500
        borderWidth: 1,
    },
    errorBanner: {
        backgroundColor: '#FEE2E2', // red-100
        borderColor: '#EF4444', // red-500
        borderWidth: 1,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
    },
    upgradeButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 6,
    },
    upgradeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    paywallContainer: {
        backgroundColor: Colors.light.surface,
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    paywallTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    paywallMessage: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
});