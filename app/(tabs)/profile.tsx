import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
// import { locationService } from '@/lib/services/location-service';
import { notificationService } from '@/lib/services/notification-service';
import { useAppStore } from '@/stores/app-store';

type ThemePreference = 'system' | 'light' | 'dark';

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const {
        user, userSettings, setUserSettings, updateUserSettings, logout,
        subscription, themePreference, setThemePreference
    } = useAppStore();

    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'surface');
    const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
    const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const iconSecondary = useThemeColor({}, 'iconSecondary');
    const borderColor = useThemeColor({}, 'border');
    const primaryColor = useThemeColor({}, 'primary');
    const onAccentColor = useThemeColor({}, 'onAccent');
    const successColor = useThemeColor({}, 'success');
    const errorColor = useThemeColor({}, 'error');

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
    const badgeTextColor = colorScheme === 'dark' ? onAccentColor : '#FFFFFF';

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
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyloguj',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    const handleSettingChange = async (setting: string, value: boolean) => {
        if (!userSettings) return;

        try {
            const newSettings = { ...userSettings, [setting]: value };
            setUserSettings(newSettings);
            await updateUserSettings({ [setting]: value });

            switch (setting) {
                case 'notificationsEnabled':
                    if (value) {
                        await notificationService.initialize();
                    } else {
                        await notificationService.cancelAllNotifications();
                    }
                    break;
                case 'pushNotifications':
                    if (value) {
                        const granted = await notificationService.requestPushPermissions();
                        if (granted) {
                            await notificationService.getPushToken();
                        }
                    }
                    break;
                case 'betaFeaturesEnabled':
                    if (value) {
                        await notificationService.notifyAI('Funkcje beta zostały włączone! Odkryj nowe możliwości.');
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Failed to update setting:', error);
            const revertedSettings = { ...userSettings, [setting]: !value };
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

    const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
        { value: 'system', label: 'System', icon: 'circle.lefthalf.filled' },
        { value: 'light', label: 'Jasny', icon: 'sun.max.fill' },
        { value: 'dark', label: 'Ciemny', icon: 'moon.fill' },
    ];

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                    <View style={styles.profileSection}>
                        <View style={[styles.avatarContainer, { backgroundColor: backgroundSecondary }]}>
                            <IconSymbol name="person.circle" size={48} color={primaryColor} />
                        </View>
                        <View style={styles.profileInfo}>
                            <ThemedText variant="headlineMedium" style={styles.userName}>
                                {user?.name || 'Użytkownik'}
                            </ThemedText>
                            <ThemedText variant="bodyMedium" color="secondary">
                                {user?.email || 'email@example.com'}
                            </ThemedText>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <IconSymbol name="chevron.right" size={16} color={iconSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Wygląd
                    </ThemedText>
                    <View style={[styles.themeSwitcher, { backgroundColor: surfaceColor, borderColor, ...getElevation(colorScheme, 1) }]}>
                        {themeOptions.map((option) => {
                            const isSelected = themePreference === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.themeOption,
                                        isSelected && { backgroundColor: primaryColor },
                                    ]}
                                    onPress={() => setThemePreference(option.value)}
                                >
                                    <IconSymbol
                                        name={option.icon}
                                        size={18}
                                        color={isSelected ? onAccentColor : textSecondary}
                                    />
                                    <ThemedText
                                        variant="labelLarge"
                                        style={[
                                            styles.themeOptionLabel,
                                            { color: isSelected ? onAccentColor : textSecondary },
                                        ]}
                                    >
                                        {option.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Subscription Status Section */}
                <View style={styles.section}>
                    <View style={[
                        styles.subscriptionCard,
                        { backgroundColor: surfaceColor, borderColor: subscriptionInfo.isPremium ? primaryColor : borderColor, ...getElevation(colorScheme, 2) },
                        !subscriptionInfo.isPremium && { backgroundColor: surfaceSecondary },
                    ]}>
                        <View style={styles.subscriptionHeader}>
                            <IconSymbol
                                name={subscriptionInfo.isPremium ? "crown.fill" : "creditcard"}
                                size={24}
                                color={primaryColor}
                            />
                            <ThemedText variant="titleMedium" style={styles.subscriptionTitle}>{subscriptionInfo.planName}</ThemedText>
                            <View style={[
                                styles.subscriptionBadge,
                                { backgroundColor: subscriptionInfo.isActive ? successColor : errorColor },
                            ]}>
                                <ThemedText variant="labelSmall" style={{ color: badgeTextColor }}>
                                    {subscriptionInfo.status}
                                </ThemedText>
                            </View>
                        </View>
                        {subscriptionInfo.renewalDate && (
                            <ThemedText variant="bodyMedium" color="secondary" style={styles.subscriptionRenewal}>
                                Odnowienie: {new Date(subscriptionInfo.renewalDate).toLocaleDateString('pl-PL')}
                            </ThemedText>
                        )}
                        <ThemedText variant="bodyMedium" color="secondary" style={styles.subscriptionDescription}>
                            {subscriptionInfo.isPremium
                                ? 'Masz dostęp do wszystkich funkcji Premium'
                                : 'Przejdź na Premium aby odblokować zaawansowane funkcje'
                            }
                        </ThemedText>
                        {!subscriptionInfo.isPremium && (
                            <TouchableOpacity
                                style={[styles.subscriptionButton, { backgroundColor: primaryColor }]}
                                onPress={() => navigation.navigate('Subscription')}
                            >
                                <ThemedText variant="titleSmall" style={{ color: onAccentColor, fontWeight: '600' }}>
                                    Przejdź na Premium
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Personalization Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Personalizacja
                    </ThemedText>

                    <View style={[styles.settingsContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="bell.fill" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Powiadomienia</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
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
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="app.badge" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Powiadomienia push</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
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
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>
                    </View>
                </View>

                {/* Privacy & Analytics Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Prywatność i analityka
                    </ThemedText>

                    <View style={[styles.settingsContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="chart.bar.xaxis" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Zaawansowana analityka</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
                                        Wyłącz jeśli nie chcesz analizy wzorców zachowań
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={analyticsEnabled}
                                onValueChange={(value) => {
                                    setAnalyticsEnabled(value);
                                    handleSettingChange('analyticsEnabled', value);
                                }}
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="location" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Lokalizacja</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
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
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="flask" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Funkcje beta</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
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
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>
                    </View>
                </View>

                {/* Profile Menu */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Profil
                    </ThemedText>

                    <View style={[styles.menuContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        {profileMenuItems.map((item, index) => (
                            <TouchableOpacity
                                key={`profile-${index}`}
                                style={[styles.menuItem, { borderBottomColor: borderColor }, index === profileMenuItems.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <IconSymbol name={item.icon} size={20} color={primaryColor} />
                                    <View style={styles.menuItemText}>
                                        <View style={styles.menuItemTitleRow}>
                                            <ThemedText variant="bodyLarge" style={styles.menuItemTitle}>{item.title}</ThemedText>
                                            {item.isPremium && !subscriptionInfo.isPremium && (
                                                <View style={[styles.premiumIndicator, { backgroundColor: primaryColor }]}>
                                                    <ThemedText variant="labelSmall" style={{ color: onAccentColor, fontWeight: '700' }}>PRO</ThemedText>
                                                </View>
                                            )}
                                        </View>
                                        <ThemedText variant="bodySmall" color="secondary">
                                            {item.description}
                                        </ThemedText>
                                    </View>
                                </View>
                                <IconSymbol name="chevron.right" size={16} color={iconSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Informacje
                    </ThemedText>

                    <View style={[styles.menuContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        {aboutMenuItems.map((item, index) => (
                            <TouchableOpacity
                                key={`about-${index}`}
                                style={[styles.menuItem, { borderBottomColor: borderColor }, index === aboutMenuItems.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <IconSymbol
                                        name={item.icon}
                                        size={20}
                                        color={item.isDestructive ? errorColor : primaryColor}
                                    />
                                    <View style={styles.menuItemText}>
                                        <ThemedText
                                            variant="bodyLarge"
                                            style={[styles.menuItemTitle, item.isDestructive && { color: errorColor }]}
                                        >
                                            {item.title}
                                        </ThemedText>
                                        <ThemedText variant="bodySmall" color="secondary">
                                            {item.description}
                                        </ThemedText>
                                    </View>
                                </View>
                                {!item.isDestructive && (
                                    <IconSymbol name="chevron.right" size={16} color={iconSecondary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.appInfoSection}>
                    <ThemedText variant="bodySmall" color="secondary">Wersja 1.0.0</ThemedText>
                    <ThemedText variant="bodySmall" color="tertiary">© 2026 Three Three</ThemedText>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        marginBottom: 4,
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
    },
    themeSwitcher: {
        flexDirection: 'row',
        borderRadius: DesignSystem.borderRadius.lg,
        padding: 4,
        gap: 4,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: DesignSystem.borderRadius.md,
    },
    themeOptionLabel: {
        fontWeight: '600',
    },
    settingsContainer: {
        borderRadius: DesignSystem.borderRadius.lg,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
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
        marginBottom: 2,
        fontWeight: '500',
    },
    menuContainer: {
        borderRadius: DesignSystem.borderRadius.lg,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
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
        marginBottom: 2,
        fontWeight: '500',
    },
    menuItemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    premiumIndicator: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    subscriptionCard: {
        borderRadius: DesignSystem.borderRadius.lg,
        padding: 20,
        marginBottom: 8,
        borderWidth: 1.5,
    },
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    subscriptionTitle: {
        flex: 1,
    },
    subscriptionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: DesignSystem.borderRadius.full,
    },
    subscriptionRenewal: {
        marginBottom: 8,
    },
    subscriptionDescription: {
        marginBottom: 16,
    },
    subscriptionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: DesignSystem.borderRadius.md,
        alignItems: 'center',
    },
    appInfoSection: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 4,
    },
});
