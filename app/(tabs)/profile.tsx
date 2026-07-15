import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
// import { locationService } from '@/lib/services/location-service';
import { notificationService } from '@/lib/services/notification-service';
import { useAppStore } from '@/stores/app-store';

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { user, userSettings, setUserSettings, updateUserSettings, logout, subscription, subscriptionStatus } = useAppStore();

    // Get subscription details for enterprise display
    const getSubscriptionDisplayInfo = () => {
        if (!subscription) {
            return {
                planName: 'Plan Podstawowy',
                status: 'Aktywny',
                renewalDate: null,
                isActive: false,
                isPremium: false
            };
        }

        const planNames = {
            'basic': 'Basic',
            'premium': 'Premium',
            'premium-yearly': 'Premium Roczny'
        };

        return {
            planName: planNames[subscription.id as keyof typeof planNames] || subscription.name,
            status: subscription.isActive ? 'Aktywny' : 'Nieaktywny',
            renewalDate: subscription.nextBillingDate,
            isActive: subscription.isActive,
            isPremium: subscription.id !== 'basic'
        };
    };

    const subscriptionInfo = getSubscriptionDisplayInfo();

    // Lokalne stany dla ustawień
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(
        userSettings?.notificationsEnabled ?? true
    );
    const [pushNotifications, setPushNotifications] = React.useState(
        userSettings?.pushNotifications ?? false
    );
    const [analyticsEnabled, setAnalyticsEnabled] = React.useState(
        userSettings?.analyticsEnabled ?? true
    );
    const [locationTrackingEnabled, setLocationTrackingEnabled] = React.useState(
        userSettings?.locationTrackingEnabled ?? false
    );
    const [betaFeaturesEnabled, setBetaFeaturesEnabled] = React.useState(
        userSettings?.betaFeaturesEnabled ?? false
    );

    const handleLogout = () => {
        Alert.alert(
            'Wyloguj się',
            'Czy na pewno chcesz się wylogować?',
            [
                {
                    text: 'Anuluj',
                    style: 'cancel',
                },
                {
                    text: 'Wyloguj',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        // Logout sets isOnboarding to true, which will automatically show OnboardingFlow
                    },
                },
            ]
        );
    };

    const handleSettingChange = async (setting: string, value: boolean) => {
        if (!userSettings) return;

        try {
            // Update locally first for immediate UI feedback
            const newSettings = {
                ...userSettings,
                [setting]: value,
            };
            setUserSettings(newSettings);

            // Save to API
            await updateUserSettings({ [setting]: value });

            // Apply real functionality based on setting
            switch (setting) {
                case 'notificationsEnabled':
                    // Kontroluje WSZYSTKIE powiadomienia w aplikacji
                    if (value) {
                        await notificationService.initialize();
                        console.log('📧 Notifications enabled and service initialized');
                    } else {
                        await notificationService.cancelAllNotifications();
                        console.log('📧 Notifications disabled, all cancelled');
                    }
                    break;

                case 'pushNotifications':
                    // Kontroluje push notifications
                    if (value) {
                        const granted = await notificationService.requestPushPermissions();
                        if (granted) {
                            const token = await notificationService.getPushToken();
                            console.log('📱 Push notifications enabled, token:', token);
                        } else {
                            console.log('📱 Push notification permissions denied');
                        }
                    } else {
                        console.log('📱 Push notifications disabled');
                    }
                    break;

                case 'analyticsEnabled':
                    // Kontroluje zaawansowaną analitykę - AnalyticsView już sprawdza to ustawienie
                    console.log(`📊 Advanced analytics ${value ? 'enabled' : 'disabled'}`);
                    break;

                case 'locationTrackingEnabled':
                    // Kontroluje dostęp do GPS
                    if (value) {
                        // TODO: Uncomment when development build includes expo-location
                        // const started = await locationService.startLocationTracking();
                        console.log('📍 Location tracking enabled (temporarily disabled - need new dev build)');
                        // if (started) {
                        //     console.log('📍 Location tracking enabled and started');
                        // } else {
                        //     console.log('📍 Failed to start location tracking');
                        // }
                    } else {
                        // await locationService.stopLocationTracking();
                        console.log('📍 Location tracking disabled (temporarily disabled - need new dev build)');
                    }
                    break;

                case 'betaFeaturesEnabled':
                    // Kontroluje widoczność funkcji beta - AI Lab w ai.tsx już sprawdza to ustawienie
                    console.log(`🧪 Beta features ${value ? 'enabled' : 'disabled'}`);
                    if (value) {
                        await notificationService.notifyAI('Funkcje beta zostały włączone! Odkryj nowe możliwości.');
                    }
                    break;
            }

        } catch (error) {
            console.error('❌ Failed to update setting:', error);
            // Revert local change on error
            const revertedSettings = {
                ...userSettings,
                [setting]: !value,
            };
            setUserSettings(revertedSettings);

            Alert.alert(
                'Błąd',
                'Nie udało się zapisać ustawienia. Sprawdź połączenie internetowe i spróbuj ponownie.'
            );
        }
    };

    const profileMenuItems = [
        {
            title: 'Zarządzanie subskrypcją',
            description: `${subscriptionInfo.planName} • ${subscriptionInfo.status}`,
            icon: 'creditcard.fill' as const,
            onPress: () => navigation.navigate('Subscription'),
            isPremium: true,
        },
        {
            title: 'Historia płatności',
            description: 'Zobacz historię transakcji i faktury',
            icon: 'doc.text.fill' as const,
            onPress: () => Alert.alert('Historia płatności', 'Funkcja zostanie wkrótce dodana'),
            isPremium: true,
        },
        {
            title: 'Cele osobiste',
            description: 'Ustaw swoje cele i prioryty',
            icon: 'paperplane.fill' as const,
            onPress: () => Alert.alert('Cele', 'Funkcja celów zostanie wkrótce dodana'),
        },
        {
            title: 'Historia aktywności',
            description: 'Zobacz swoją aktywność w aplikacji',
            icon: 'chart.bar.fill' as const,
            onPress: () => Alert.alert('Historia', 'Funkcja historii zostanie wkrótce dodana'),
        },
        {
            title: 'Eksport danych',
            description: 'Pobierz swoje dane w formacie CSV',
            icon: 'list.bullet' as const,
            onPress: () => Alert.alert('Eksport', 'Funkcja eksportu zostanie wkrótce dodana'),
        },
    ];

    const aboutMenuItems = [
        {
            title: 'Pomoc i wsparcie',
            description: 'Znajdź odpowiedzi na pytania',
            icon: 'questionmark.circle' as const,
            onPress: () => Alert.alert('Pomoc', 'Skontaktuj się z naszym zespołem wsparcia'),
        },
        {
            title: 'Polityka prywatności',
            description: 'Jak chronimy Twoje dane',
            icon: 'shield' as const,
            onPress: () => Alert.alert('Prywatność', 'Polityka prywatności zostanie wyświetlona'),
        },
        {
            title: 'Regulamin',
            description: 'Warunki korzystania z aplikacji',
            icon: 'doc.text' as const,
            onPress: () => Alert.alert('Regulamin', 'Regulamin zostanie wyświetlony'),
        },
        {
            title: 'Wyloguj się',
            description: 'Zakończ sesję w aplikacji',
            icon: 'rectangle.portrait.and.arrow.right' as const,
            onPress: handleLogout,
            isDestructive: true,
        },
    ];

    return (
        <View style={styles.container}>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <IconSymbol name="person.circle" size={48} color={Colors.light.tint} />
                        </View>
                        <View style={styles.profileInfo}>
                            <ThemedText variant="headlineMedium" style={styles.userName}>
                                {user?.name || 'Użytkownik'}
                            </ThemedText>
                            <ThemedText style={styles.userEmail}>
                                {user?.email || 'email@example.com'}
                            </ThemedText>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <IconSymbol name="chevron.right" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Subscription Status Section */}
                <View style={styles.section}>
                    <View style={[styles.subscriptionCard, !subscriptionInfo.isPremium && styles.subscriptionCardFree]}>
                        <View style={styles.subscriptionHeader}>
                            <IconSymbol
                                name={subscriptionInfo.isPremium ? "crown.fill" : "creditcard"}
                                size={24}
                                color={subscriptionInfo.isPremium ? "#FFD700" : Colors.light.tint}
                            />
                            <ThemedText style={styles.subscriptionTitle}>{subscriptionInfo.planName}</ThemedText>
                            <View style={[styles.subscriptionBadge, subscriptionInfo.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                                <ThemedText style={[styles.subscriptionBadgeText, subscriptionInfo.isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                                    {subscriptionInfo.status}
                                </ThemedText>
                            </View>
                        </View>
                        {subscriptionInfo.renewalDate && (
                            <ThemedText style={styles.subscriptionRenewal}>
                                Odnowienie: {new Date(subscriptionInfo.renewalDate).toLocaleDateString('pl-PL')}
                            </ThemedText>
                        )}
                        <ThemedText style={styles.subscriptionDescription}>
                            {subscriptionInfo.isPremium
                                ? 'Masz dostęp do wszystkich funkcji Premium'
                                : 'Przejdź na Premium aby odblokować zaawansowane funkcje'
                            }
                        </ThemedText>
                        {!subscriptionInfo.isPremium && (
                            <TouchableOpacity style={styles.subscriptionButton} onPress={() => navigation.navigate('Subscription')}>
                                <ThemedText style={styles.subscriptionButtonText}>Przejdź na Premium</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Personalization Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Personalizacja
                    </ThemedText>

                    <View style={styles.settingsContainer}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="bell.fill" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Powiadomienia</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Wyłącz gdy potrzebujesz skupienia lub odpoczynku
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={(value) => {
                                    setNotificationsEnabled(value);
                                    handleSettingChange('notificationsEnabled', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="app.badge" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Powiadomienia push</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Alternatywa: otrzymuj tylko powiadomienia email
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={pushNotifications}
                                onValueChange={(value) => {
                                    setPushNotifications(value);
                                    handleSettingChange('pushNotifications', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={pushNotifications ? '#f5dd4b' : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </View>

                {/* Privacy & Analytics Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Prywatność i Analityka
                    </ThemedText>

                    <View style={styles.settingsContainer}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="chart.bar.xaxis" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Zaawansowana analityka</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Wyłącz jeśli nie chcesz analizy wzorceów zachowań
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={analyticsEnabled}
                                onValueChange={(value) => {
                                    setAnalyticsEnabled(value);
                                    handleSettingChange('analyticsEnabled', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={analyticsEnabled ? '#f5dd4b' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="location" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Lokalizacja</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Wyłącz dla prywatności i oszczędzania baterii
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={locationTrackingEnabled}
                                onValueChange={(value) => {
                                    setLocationTrackingEnabled(value);
                                    handleSettingChange('locationTrackingEnabled', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={locationTrackingEnabled ? '#f5dd4b' : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="flask" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Funkcje beta</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Wyłącz jeśli wolisz stabilność niż nowości
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={betaFeaturesEnabled}
                                onValueChange={(value) => {
                                    setBetaFeaturesEnabled(value);
                                    handleSettingChange('betaFeaturesEnabled', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={betaFeaturesEnabled ? '#f5dd4b' : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </View>


                {/* Profile Menu */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Profil
                    </ThemedText>

                    <View style={styles.menuContainer}>
                        {profileMenuItems.map((item, index) => (
                            <TouchableOpacity key={`profile-${index}`} style={styles.menuItem} onPress={item.onPress}>
                                <View style={styles.menuItemLeft}>
                                    <IconSymbol name={item.icon} size={20} color={Colors.light.tint} />
                                    <View style={styles.menuItemText}>
                                        <View style={styles.menuItemTitleRow}>
                                            <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                                            {item.isPremium && !subscriptionInfo.isPremium && (
                                                <View style={styles.premiumIndicator}>
                                                    <ThemedText style={styles.premiumIndicatorText}>PRO</ThemedText>
                                                </View>
                                            )}
                                        </View>
                                        <ThemedText style={styles.menuItemDescription}>
                                            {item.description}
                                        </ThemedText>
                                    </View>
                                </View>
                                <IconSymbol name="chevron.right" size={16} color="#ccc" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Informacje
                    </ThemedText>

                    <View style={styles.menuContainer}>
                        {aboutMenuItems.map((item, index) => (
                            <TouchableOpacity key={`about-${index}`} style={styles.menuItem} onPress={item.onPress}>
                                <View style={styles.menuItemLeft}>
                                    <IconSymbol
                                        name={item.icon}
                                        size={20}
                                        color={item.isDestructive ? '#ff3b30' : Colors.light.tint}
                                    />
                                    <View style={styles.menuItemText}>
                                        <ThemedText style={[
                                            styles.menuItemTitle,
                                            item.isDestructive && { color: '#ff3b30' }
                                        ]}>
                                            {item.title}
                                        </ThemedText>
                                        <ThemedText style={styles.menuItemDescription}>
                                            {item.description}
                                        </ThemedText>
                                    </View>
                                </View>
                                {!item.isDestructive && (
                                    <IconSymbol name="chevron.right" size={16} color="#ccc" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.appInfoSection}>
                    <ThemedText style={styles.appVersion}>Wersja 1.0.0</ThemedText>
                    <ThemedText style={styles.appCopyright}>© 2024 Voice Tasks</ThemedText>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60, // Will be overridden with dynamic style
        paddingBottom: 24,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        marginBottom: 4,
    },
    userEmail: {
        opacity: 0.6,
        fontSize: 14,
    },
    editButton: {
        padding: 8,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        marginBottom: 16,
        color: '#333',
    },
    premiumCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    premiumTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    premiumBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    premiumDescription: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
        marginBottom: 16,
    },
    premiumButton: {
        backgroundColor: Colors.light.tint,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    premiumButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    settingsContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        opacity: 0.6,
        lineHeight: 18,
    },
    menuContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    menuItemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    premiumIndicator: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    premiumIndicatorText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000',
    },
    subscriptionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    subscriptionCardFree: {
        borderColor: '#E5E5E5',
        backgroundColor: '#FAFAFA',
    },
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    subscriptionTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        color: '#1A1A1A',
    },
    subscriptionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: '#10B981',
    },
    inactiveBadge: {
        backgroundColor: '#F87171',
    },
    subscriptionBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeBadgeText: {
        color: 'white',
    },
    inactiveBadgeText: {
        color: 'white',
    },
    subscriptionRenewal: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    subscriptionDescription: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
        marginBottom: 16,
    },
    subscriptionButton: {
        backgroundColor: Colors.light.tint,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    subscriptionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    menuItemDescription: {
        fontSize: 13,
        opacity: 0.6,
        lineHeight: 18,
    },
    appInfoSection: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 4,
    },
    appVersion: {
        fontSize: 14,
        opacity: 0.6,
    },
    appCopyright: {
        fontSize: 12,
        opacity: 0.4,
    },
});