import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModernCard } from '@/components/modern-card';
import { ModernView } from '@/components/modern-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSleepRecording } from '@/hooks/use-sleep-recording';
import { useAppStore } from '@/stores/app-store';

export default function SleepScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const {
        isRecordingEnabled,
        sleepConfig,
        startSleepRecording,
        stopSleepRecording,
        updateSleepConfig,
        getCurrentSleepSession,
    } = useSleepRecording();

    const { user } = useAppStore();

    // Mock last sleep analysis for now
    const getLastSleepAnalysis = () => {
        // In production, this would fetch the latest sleep analysis from the backend
        const currentSession = getCurrentSleepSession();
        if (!currentSession) return null;

        return {
            snoringEvents: [],
            sleepTalkingEvents: [],
            sleepQuality: 0.85,
            totalSleepDuration: 480, // 8 hours in minutes
        };
    };

    const lastSleepAnalysis = getLastSleepAnalysis();

    const handleToggleSleepRecording = async () => {
        if (isRecordingEnabled) {
            Alert.alert(
                'Zatrzymać nagrywanie snu?',
                'Czy na pewno chcesz zatrzymać monitorowanie snu?',
                [
                    { text: 'Anuluj', style: 'cancel' },
                    {
                        text: 'Zatrzymaj',
                        style: 'destructive',
                        onPress: async () => {
                            await stopSleepRecording();
                        },
                    },
                ]
            );
        } else {
            Alert.alert(
                '🌙 Rozpocząć monitoring snu?',
                'Aplikacja będzie nagrywać dźwięki przez całą noc aby wykryć chrapanie, mówienie przez sen i analizować jakość snu.',
                [
                    { text: 'Anuluj', style: 'cancel' },
                    {
                        text: 'Rozpocznij',
                        onPress: async () => {
                            const success = await startSleepRecording();
                            if (success) {
                                Alert.alert(
                                    '✅ Monitoring rozpoczęty!',
                                    'Możesz teraz położyć telefon obok łóżka. Nagrywanie będzie działać w tle.',
                                    [{ text: 'OK' }]
                                );
                            }
                        },
                    },
                ]
            );
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSensitivityIcon = (level: string) => {
        switch (level) {
            case 'low': return 'speaker.1';
            case 'medium': return 'speaker.2';
            case 'high': return 'speaker.3';
            default: return 'speaker.2';
        }
    };

    const getSensitivityDescription = (level: string) => {
        switch (level) {
            case 'low': return 'Wykrywa tylko głośne dźwięki (chrapanie, głośne mówienie)';
            case 'medium': return 'Wykrywa większość dźwięków (zalecane)';
            case 'high': return 'Wykrywa nawet ciche dźwięki (może wykryć oddech)';
            default: return '';
        }
    };

    return (
        <ModernView style={{ flex: 1 }}>
            <StatusBar style="auto" />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: DesignSystem.spacing.lg,
                    paddingTop: insets.top + DesignSystem.spacing.lg,
                    paddingBottom: DesignSystem.spacing['4xl'],
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Gradient */}
                <LinearGradient
                    colors={['#1a1a2e', '#16213e', '#0f3460']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.moonContainer}>
                        <IconSymbol name="moon.fill" size={40} color="#ffffff" />
                    </View>

                    <ThemedText
                        variant="displaySmall"
                        style={[styles.headerTitle, { color: '#ffffff' }]}
                    >
                        Monitor snu
                    </ThemedText>

                    <ThemedText
                        variant="bodyLarge"
                        style={[styles.headerSubtitle, { color: '#ffffff90' }]}
                    >
                        {isRecordingEnabled
                            ? 'Nagrywanie aktywne - śpij spokojnie'
                            : 'Wykryj chrapanie i przeanalizuj jakość snu'
                        }
                    </ThemedText>
                </LinearGradient>

                {/* Main Control */}
                <ModernCard
                    elevation={3}
                    style={{ marginBottom: DesignSystem.spacing.xl }}
                >
                    <View style={styles.controlSection}>
                        <View style={styles.controlHeader}>
                            <Text style={[styles.controlTitle, { color: colors.text }]}>
                                {isRecordingEnabled ? 'Monitoring aktywny' : 'Rozpocznij monitoring'}
                            </Text>
                            <Switch
                                value={isRecordingEnabled}
                                onValueChange={handleToggleSleepRecording}
                                trackColor={{
                                    false: colors.gray + '30',
                                    true: colors.primary + '30',
                                }}
                                thumbColor={isRecordingEnabled ? colors.primary : colors.gray}
                            />
                        </View>

                        {isRecordingEnabled && (
                            <View style={styles.activeStatus}>
                                <View style={styles.pulsingDot} />
                                <Text style={[styles.statusText, { color: colors.primary }]}>
                                    Nagrywanie w toku...
                                </Text>
                            </View>
                        )}

                        <Text style={[styles.controlDescription, { color: colors.textSecondary }]}>
                            Aplikacja będzie automatycznie nagrywać w godzinach snu i analizować:
                        </Text>

                        <View style={styles.featureList}>
                            {[
                                { icon: 'moon.zzz', text: 'Wykrywanie chrapania' },
                                { icon: 'cloud', text: 'Mówienie przez sen' },
                                { icon: 'chart.bar', text: 'Jakość snu' },
                                { icon: 'gear', text: 'Automatyczne zarządzanie' },
                            ].map((feature, index) => (
                                <View key={index} style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                        <IconSymbol name={feature.icon} size={16} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.featureText, { color: colors.text }]}>
                                        {feature.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </ModernCard>

                {/* Sleep Configuration */}
                <ModernCard
                    title="Ustawienia"
                    elevation={2}
                    style={{ marginBottom: DesignSystem.spacing.xl }}
                >
                    {/* Time Settings */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingHeader}>
                            <IconSymbol name="clock" size={20} color={colors.primary} />
                            <Text style={[styles.settingTitle, { color: colors.text }]}>
                                Godziny snu
                            </Text>
                        </View>
                        <View style={styles.timeContainer}>
                            <TouchableOpacity style={[styles.timeButton, { borderColor: colors.border }]}>
                                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Początek</Text>
                                <Text style={[styles.timeValue, { color: colors.text }]}>
                                    {formatTime(sleepConfig.startTime)}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.timeButton, { borderColor: colors.border }]}>
                                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Koniec</Text>
                                <Text style={[styles.timeValue, { color: colors.text }]}>
                                    {formatTime(sleepConfig.endTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sensitivity Settings */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingHeader}>
                            <IconSymbol name="waveform" size={20} color={colors.primary} />
                            <Text style={[styles.settingTitle, { color: colors.text }]}>
                                Czułość mikrofonu
                            </Text>
                        </View>

                        <View style={styles.sensitivityContainer}>
                            {(['low', 'medium', 'high'] as const).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.sensitivityButton,
                                        {
                                            backgroundColor: sleepConfig.sensitivity === level
                                                ? colors.primary + '15'
                                                : colors.surface,
                                            borderColor: sleepConfig.sensitivity === level
                                                ? colors.primary
                                                : colors.border,
                                        }
                                    ]}
                                    onPress={() => updateSleepConfig({ sensitivity: level })}
                                >
                                    <IconSymbol
                                        name={getSensitivityIcon(level)}
                                        size={18}
                                        color={sleepConfig.sensitivity === level ? colors.primary : colors.gray}
                                    />
                                    <Text style={[
                                        styles.sensitivityLabel,
                                        {
                                            color: sleepConfig.sensitivity === level
                                                ? colors.primary
                                                : colors.text
                                        }
                                    ]}>
                                        {level === 'low' ? 'Niska' : level === 'medium' ? 'Średnia' : 'Wysoka'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sensitivityDescription, { color: colors.textSecondary }]}>
                            {getSensitivityDescription(sleepConfig.sensitivity)}
                        </Text>
                    </View>

                    {/* Airplane Mode Toggle */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingHeader}>
                                <IconSymbol name="airplane" size={20} color={colors.primary} />
                                <View>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Tryb samolotowy
                                    </Text>
                                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                                        Zalecane dla lepszego snu
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={sleepConfig.airplaneMode}
                                onValueChange={(value) => updateSleepConfig({ airplaneMode: value })}
                                trackColor={{
                                    false: colors.gray + '30',
                                    true: colors.primary + '30',
                                }}
                                thumbColor={sleepConfig.airplaneMode ? colors.primary : colors.gray}
                            />
                        </View>
                    </View>
                </ModernCard>

                {/* Last Night Analysis */}
                {lastSleepAnalysis && (
                    <ModernCard
                        title="Ostatnia analiza"
                        elevation={2}
                        style={{ marginBottom: DesignSystem.spacing.xl }}
                    >
                        <View style={styles.analysisContainer}>
                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="moon.zzz" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Chrapanie
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: colors.text }]}>
                                        {lastSleepAnalysis.snoringEvents.length} epizodów
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="cloud" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Mówienie przez sen
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: colors.text }]}>
                                        {lastSleepAnalysis.sleepTalkingEvents.length} razy
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="star" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Jakość snu
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: colors.text }]}>
                                        {Math.round(lastSleepAnalysis.sleepQuality * 100)}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="clock" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Czas snu
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: colors.text }]}>
                                        {Math.round(lastSleepAnalysis.totalSleepDuration / 60)} min
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ModernCard>
                )}

                {/* Enterprise Tips */}
                <ModernCard
                    title="Wskazówki"
                    elevation={1}
                >
                    <View style={styles.tipsContainer}>
                        {[
                            'Położ telefon na stoliku nocnym, mikrofonem w stronę łóżka',
                            'Upewnij się, że telefon ma wystarczający poziom baterii',
                            'Włącz tryb samolotowy aby uniknąć zakłóceń',
                            'Regularna analiza snu pomoże wykryć problemy zdrowotne',
                        ].map((tip, index) => (
                            <View key={index} style={styles.tipItem}>
                                <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                                    {tip}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ModernCard>
            </ScrollView>
        </ModernView>
    );
}

const styles = StyleSheet.create({
    headerGradient: {
        marginBottom: DesignSystem.spacing['3xl'],
        borderRadius: DesignSystem.borderRadius['2xl'],
        padding: DesignSystem.spacing.xl,
        alignItems: 'center',
    },
    moonContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: DesignSystem.borderRadius.full,
        padding: DesignSystem.spacing.lg,
        marginBottom: DesignSystem.spacing.lg,
    },
    headerTitle: {
        textAlign: 'center',
        marginBottom: DesignSystem.spacing.sm,
        fontWeight: '700',
    },
    headerSubtitle: {
        textAlign: 'center',
        lineHeight: 24,
    },
    controlSection: {
        gap: DesignSystem.spacing.lg,
    },
    controlHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    controlTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    activeStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00ff00',
        // Add animation later
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    controlDescription: {
        fontSize: 15,
        lineHeight: 22,
    },
    featureList: {
        gap: DesignSystem.spacing.sm,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.md,
    },
    featureIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: DesignSystem.spacing.md,
    },
    featureText: {
        fontSize: 15,
        fontWeight: '500',
    },
    settingItem: {
        marginBottom: DesignSystem.spacing.xl,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
        marginBottom: DesignSystem.spacing.md,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    settingSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.md,
    },
    timeButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.lg,
        padding: DesignSystem.spacing.md,
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    sensitivityContainer: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.sm,
        marginBottom: DesignSystem.spacing.sm,
    },
    sensitivityButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.md,
        padding: DesignSystem.spacing.md,
        alignItems: 'center',
        gap: DesignSystem.spacing.xs,
    },
    sensitivityLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    sensitivityDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    analysisContainer: {
        gap: DesignSystem.spacing.lg,
    },
    analysisItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.md,
    },
    analysisIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: DesignSystem.spacing.md,
    },
    analysisLabel: {
        fontSize: 13,
    },
    analysisValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    tipsContainer: {
        gap: DesignSystem.spacing.md,
    },
    tipItem: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.sm,
    },
    tipBullet: {
        fontSize: 16,
        lineHeight: 20,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});