import LinearGradient from 'react-native-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
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
import { sleepApiService, SleepRecord, SleepStats } from '@/lib/services/sleep-api';
import { useAppStore } from '@/stores/app-store';
import { SubscriptionGate } from '@/components/subscription/subscription-gate';

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

    const { user, setError } = useAppStore();

    // Real API state management
    const [latestSleepRecord, setLatestSleepRecord] = useState<SleepRecord | null>(null);
    const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
    const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setLocalError] = useState<string | null>(null);

    // Fetch latest sleep data from API
    const fetchSleepData = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setLocalError(null);

            // Fetch data in parallel
            const [latest, stats, recentRecords] = await Promise.all([
                sleepApiService.getLatestSleepRecord(),
                sleepApiService.getSleepStats(30),
                sleepApiService.getSleepRecords({ limit: 7 })
            ]);

            setLatestSleepRecord(latest);
            setSleepStats(stats);
            setSleepRecords(recentRecords);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load sleep data';
            setLocalError(errorMessage);
            setError(errorMessage);
            console.error('Error fetching sleep data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [setError]);

    // Load data on component mount
    useEffect(() => {
        if (user) {
            fetchSleepData();
        }
    }, [user, fetchSleepData]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        fetchSleepData(true);
    }, [fetchSleepData]);

    // Add state to track if we're in the middle of manual start/stop operations
    const [isManualOperation, setIsManualOperation] = useState(false);

    const handleToggleSleepRecording = async () => {
        // Prevent feedback loops during manual operations
        if (isManualOperation) {
            return;
        }

        setIsManualOperation(true);

        try {
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
                                try {
                                    // First disable in config
                                    updateSleepConfig({ enabled: false });

                                    const analysis = await stopSleepRecording();
                                    if (analysis) {
                                        // The upload (inside stopSleepRecording) already created the
                                        // SleepTracking record on the backend and queued it for real
                                        // AI analysis — no separate record to create here. Posting one
                                        // ourselves with these placeholder zero values used to collide
                                        // with that record (same user+date) and get rejected by the
                                        // backend's validation, which made it look like nothing saved.
                                        await fetchSleepData();

                                        Alert.alert(
                                            '🌙 Nagrywanie zakończone',
                                            `Nagrano ${(analysis.totalSleepDuration / (1000 * 60 * 60)).toFixed(1)} godzin. Analiza snu jest przetwarzana i pojawi się tutaj za chwilę.`,
                                            [{ text: 'Odśwież', onPress: () => fetchSleepData() }, { text: 'OK' }]
                                        );
                                    } else {
                                        // stopSleepRecording() failed internally (e.g. the upload
                                        // errored out) and already reported it via setError — but
                                        // that error can be easy to miss, so also make it explicit
                                        // that nothing was saved rather than silently doing nothing.
                                        Alert.alert(
                                            '⚠️ Nie udało się zapisać nagrania',
                                            'Przesłanie nagrania snu na serwer nie powiodło się. Analiza nie została zapisana — spróbuj ponownie przy lepszym połączeniu.',
                                            [{ text: 'OK' }]
                                        );
                                    }
                                } catch (error) {
                                    console.error('Error stopping sleep recording:', error);
                                    setError('Błąd podczas zatrzymywania nagrywania snu');
                                }
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    '🌙 Rozpocząć monitoring snu?',
                    'Aplikacja będzie nagrywać dźwięki przez całą noc aby wykryć chrapanie, mówienie przez sen i analizować jakość snu.',
                    [
                        {
                            text: 'Anuluj',
                            style: 'cancel',
                            onPress: () => setIsManualOperation(false)
                        },
                        {
                            text: 'Rozpocznij',
                            onPress: async () => {
                                try {
                                    console.log('User clicked Rozpocznij button');

                                    // First enable in config
                                    updateSleepConfig({ enabled: true });

                                    // Small delay to ensure state is updated
                                    await new Promise(resolve => setTimeout(resolve, 100));

                                    console.log('Starting sleep recording with current config:', sleepConfig);

                                    const success = await startSleepRecording(true); // Force start
                                    console.log('Sleep recording start result:', success);

                                    if (success) {
                                        Alert.alert(
                                            '✅ Monitoring rozpoczęty!',
                                            'Możesz teraz położyć telefon obok łóżka. Nagrywanie będzie działać w tle.',
                                            [{ text: 'OK' }]
                                        );
                                    } else {
                                        // Reset config if failed
                                        updateSleepConfig({ enabled: false });
                                        Alert.alert(
                                            'Błąd',
                                            'Nie udało się rozpocząć monitorowania snu. Sprawdź uprawnienia do mikrofonu.',
                                            [{ text: 'OK' }]
                                        );
                                    }
                                } catch (error) {
                                    console.error('Error starting sleep recording:', error);
                                    updateSleepConfig({ enabled: false });
                                    setError('Błąd podczas rozpoczynania nagrywania snu');
                                } finally {
                                    setIsManualOperation(false);
                                }
                            },
                        },
                    ]
                );
            }
        } finally {
            setIsManualOperation(false);
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

    // Utility functions for formatting sleep data
    const formatSleepDuration = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const getSnoringIntensityText = (intensity: string) => {
        switch (intensity) {
            case 'none': return 'Brak';
            case 'light': return 'Słabe';
            case 'moderate': return 'Umiarkowane';
            case 'heavy': return 'Silne';
            default: return 'Nieznane';
        }
    };

    const getSnoringIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'none': return colors.success;
            case 'light': return colors.warning;
            case 'moderate': return colors.error;
            case 'heavy': return colors.error;
            default: return colors.text;
        }
    };

    const getQualityColor = (quality: number) => {
        if (quality >= 8) return colors.success;
        if (quality >= 6) return colors.warning;
        return colors.error;
    };

    // Loading state
    if (loading) {
        return (
            <ModernView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText variant="bodyLarge" style={{ marginTop: DesignSystem.spacing.md }}>
                    Ładowanie danych o śnie...
                </ThemedText>
            </ModernView>
        );
    }

    return (
            <SubscriptionGate
              feature="sleep_screen"
              screenTitle="Ekran główny"
            >
        <ModernView style={{ flex: 1 }}>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: DesignSystem.spacing.lg,
                    paddingTop: insets.top + DesignSystem.spacing.lg,
                    paddingBottom: DesignSystem.spacing['4xl'],
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
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

                {/* Latest Sleep Record Analysis */}
                {latestSleepRecord && (
                    <ModernCard
                        title="Ostatnia analiza"
                        elevation={2}
                        style={{ marginBottom: DesignSystem.spacing.xl }}
                    >
                        <View style={styles.analysisContainer}>
                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="moon.zzz" size={20} color={getSnoringIntensityColor(latestSleepRecord.snoringIntensity)} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Chrapanie
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: getSnoringIntensityColor(latestSleepRecord.snoringIntensity) }]}>
                                        {getSnoringIntensityText(latestSleepRecord.snoringIntensity)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="cloud" size={20} color={latestSleepRecord.sleepTalkingDetected ? colors.warning : colors.success} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Mówienie przez sen
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: latestSleepRecord.sleepTalkingDetected ? colors.warning : colors.text }]}>
                                        {latestSleepRecord.sleepTalkingFrequency} razy
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="star" size={20} color={getQualityColor(latestSleepRecord.sleepQualityScore)} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Jakość snu
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: getQualityColor(latestSleepRecord.sleepQualityScore) }]}>
                                        {latestSleepRecord.sleepQualityScore}/10
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
                                        {formatSleepDuration(latestSleepRecord.sleepDurationHours)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="chart.bar" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Efektywność
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: colors.text }]}>
                                        {latestSleepRecord.sleepEfficiency}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.analysisItem}>
                                <View style={[styles.analysisIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
                                </View>
                                <View>
                                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                                        Data
                                    </Text>
                                    <Text style={[styles.analysisValue, { color: colors.text }]}>
                                        {formatDate(latestSleepRecord.sleepDate)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ModernCard>
                )}

                {/* Sleep Statistics */}
                {sleepStats && sleepStats.totalRecords > 0 && (
                    <ModernCard
                        title="Statystyki (ostatnie 30 dni)"
                        elevation={2}
                        style={{ marginBottom: DesignSystem.spacing.xl }}
                    >
                        <View style={styles.statsContainer}>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.primary }]}>
                                        {formatSleepDuration(sleepStats.averageDuration)}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                        Średni czas snu
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: getQualityColor(sleepStats.averageQuality) }]}>
                                        {sleepStats.averageQuality.toFixed(1)}/10
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                        Średnia jakość
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.warning }]}>
                                        {sleepStats.snoringNights}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                        Nocy z chrapaniem
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.error }]}>
                                        {sleepStats.sleepTalkingNights}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                        Nocy z mówieniem
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.success }]}>
                                        {sleepStats.averageEfficiency.toFixed(0)}%
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                        Średnia efektywność
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.text }]}>
                                        {sleepStats.totalRecords}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                        Nagranych nocy
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ModernCard>
                )}

                {/* Recent Sleep Records */}
                {sleepRecords.length > 0 && (
                    <ModernCard
                        title="Historia snu"
                        elevation={2}
                        style={{ marginBottom: DesignSystem.spacing.xl }}
                    >
                        {sleepRecords.slice(0, 5).map((record) => (
                            <View key={record.id} style={styles.historyItem}>
                                <View style={styles.historyDate}>
                                    <Text style={[styles.historyDateText, { color: colors.text }]}>
                                        {formatDate(record.sleepDate)}
                                    </Text>
                                </View>
                                <View style={styles.historyDetails}>
                                    <Text style={[styles.historyDuration, { color: colors.primary }]}>
                                        {formatSleepDuration(record.sleepDurationHours)}
                                    </Text>
                                    <Text style={[styles.historyQuality, { color: getQualityColor(record.sleepQualityScore) }]}>
                                        {record.sleepQualityScore}/10
                                    </Text>
                                    <View style={styles.historyIndicators}>
                                        {record.snoringDetected && (
                                            <View style={[styles.indicator, { backgroundColor: getSnoringIntensityColor(record.snoringIntensity) }]}>
                                                <IconSymbol name="moon.zzz" size={12} color="#ffffff" />
                                            </View>
                                        )}
                                        {record.sleepTalkingDetected && (
                                            <View style={[styles.indicator, { backgroundColor: colors.warning }]}>
                                                <IconSymbol name="cloud" size={12} color="#ffffff" />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ModernCard>
                )}

                {/* No Data Message */}
                {!latestSleepRecord && !loading && (
                    <ModernCard
                        title="Rozpocznij monitoring"
                        elevation={1}
                        style={{ marginBottom: DesignSystem.spacing.xl }}
                    >
                        <View style={{ alignItems: 'center', padding: DesignSystem.spacing.xl }}>
                            <IconSymbol name="moon" size={48} color={colors.textSecondary} style={{ marginBottom: DesignSystem.spacing.md }} />
                            <Text style={[{ fontSize: 16, fontWeight: '500' }, { color: colors.text, textAlign: 'center', marginBottom: DesignSystem.spacing.sm }]}>
                                Nie masz jeszcze żadnych nagrań snu
                            </Text>
                            <Text style={[{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
                                Włącz monitoring snu, aby rozpocząć analizę jakości swojego odpoczynku i wykrywanie chrapania.
                            </Text>
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
        </SubscriptionGate>
    );
}

const styles = StyleSheet.create({
    headerGradient: {
        padding: DesignSystem.spacing.xl,
        borderRadius: DesignSystem.borderRadius.lg,
        marginBottom: DesignSystem.spacing.xl,
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    moonContainer: {
        marginBottom: DesignSystem.spacing.md,
    },
    headerTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: DesignSystem.spacing.xs,
    },
    headerSubtitle: {
        textAlign: 'center',
        opacity: 0.9,
    },
    controlSection: {
        padding: DesignSystem.spacing.lg,
    },
    controlHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignSystem.spacing.md,
    },
    controlTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    activeStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DesignSystem.spacing.md,
        padding: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.sm,
        backgroundColor: '#f0f9ff',
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginRight: DesignSystem.spacing.sm,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    controlDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: DesignSystem.spacing.lg,
    },
    featureList: {
        gap: DesignSystem.spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
    },
    featureIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 14,
        flex: 1,
    },
    settingItem: {
        marginBottom: DesignSystem.spacing.xl,
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
        fontSize: 12,
        marginTop: 2,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.md,
    },
    timeButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.sm,
        padding: DesignSystem.spacing.md,
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    sensitivityContainer: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.sm,
        marginBottom: DesignSystem.spacing.md,
    },
    sensitivityButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.sm,
        padding: DesignSystem.spacing.md,
        alignItems: 'center',
        gap: DesignSystem.spacing.xs,
    },
    sensitivityLabel: {
        fontSize: 12,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    analysisLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    analysisValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        gap: DesignSystem.spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: DesignSystem.spacing.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        padding: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.sm,
        backgroundColor: '#f8fafc',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: DesignSystem.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    historyDate: {
        width: 80,
    },
    historyDateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    historyDetails: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyDuration: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyQuality: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyIndicators: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.xs,
    },
    indicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipsContainer: {
        gap: DesignSystem.spacing.md,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: DesignSystem.spacing.sm,
    },
    tipBullet: {
        fontSize: 16,
        lineHeight: 20,
        marginTop: 2,
    },
    tipText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
});
