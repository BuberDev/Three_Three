import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/stores/app-store';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, userSettings, setUserSettings, logout } = useAppStore();

    // Lokalne stany dla ustawień
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(
        userSettings?.notificationsEnabled ?? true
    );
    const [dataProcessingConsent, setDataProcessingConsent] = React.useState(
        userSettings?.dataProcessingConsent ?? false
    );
    const [aiAnalysisEnabled, setAiAnalysisEnabled] = React.useState(
        userSettings?.aiAnalysisEnabled ?? true
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

    const handleSettingChange = (setting: string, value: boolean) => {
        if (!userSettings) return;

        const newSettings = {
            ...userSettings,
            [setting]: value,
        };
        setUserSettings(newSettings);
    };

    const profileMenuItems = [
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
            <StatusBar style="auto" />

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

                {/* Premium Section */}
                <View style={styles.section}>
                    <View style={styles.premiumCard}>
                        <View style={styles.premiumHeader}>
                            <IconSymbol name="brain" size={24} color="#FFD700" />
                            <ThemedText style={styles.premiumTitle}>AI Premium</ThemedText>
                            <View style={styles.premiumBadge}>
                                <ThemedText style={styles.premiumBadgeText}>PRO</ThemedText>
                            </View>
                        </View>
                        <ThemedText style={styles.premiumDescription}>
                            Odblokuj zaawansowane funkcje AI i nieograniczone analizy
                        </ThemedText>
                        <TouchableOpacity style={styles.premiumButton}>
                            <ThemedText style={styles.premiumButtonText}>Upgrade to Premium</ThemedText>
                        </TouchableOpacity>
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
                                <IconSymbol name="paperplane.fill" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Powiadomienia</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Otrzymuj przypomnienia o zadaniach
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
                                <IconSymbol name="brain" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Analiza AI</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Umożliw AI analizowanie Twoich wzorców
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={aiAnalysisEnabled}
                                onValueChange={(value) => {
                                    setAiAnalysisEnabled(value);
                                    handleSettingChange('aiAnalysisEnabled', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={aiAnalysisEnabled ? '#f5dd4b' : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </View>

                {/* Data Privacy Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Prywatność i dane
                    </ThemedText>

                    <View style={styles.settingsContainer}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="house.fill" size={20} color={Colors.light.tint} />
                                <View style={styles.settingText}>
                                    <ThemedText style={styles.settingTitle}>Zgoda na przetwarzanie</ThemedText>
                                    <ThemedText style={styles.settingDescription}>
                                        Wyrażam zgodę na przetwarzanie danych osobowych
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={dataProcessingConsent}
                                onValueChange={(value) => {
                                    setDataProcessingConsent(value);
                                    handleSettingChange('dataProcessingConsent', value);
                                }}
                                trackColor={{ false: '#767577', true: Colors.light.tint }}
                                thumbColor={dataProcessingConsent ? '#f5dd4b' : '#f4f3f4'}
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
                                        <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
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