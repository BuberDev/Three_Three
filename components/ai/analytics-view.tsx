import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/stores/app-store';

interface AnalyticsViewProps {
    completionRate: number;
    tasks: any[];
    voiceNotes: any[];
    weeklyProgress: any[];
    mockInsights: any[];
    insets: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
    completionRate,
    tasks,
    voiceNotes,
    weeklyProgress,
    mockInsights,
    insets
}) => {
    const { userSettings } = useAppStore();

    // Check if analytics are enabled
    if (!userSettings?.analyticsEnabled) {
        return (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, styles.disabledContainer]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.disabledView}>
                    <IconSymbol name="chart.bar.xaxis" size={48} color={Colors.light.icon} style={{ opacity: 0.3 }} />
                    <ThemedText style={styles.disabledTitle}>Zaawansowana analityka wyłączona</ThemedText>
                    <ThemedText style={styles.disabledDescription}>
                        Włącz zaawansowaną analitykę w ustawieniach profilu,{"\n"}
                        aby zobaczyć szczegółowe wzorce i rekomendacje.
                    </ThemedText>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <ThemedText style={styles.subtitle}>
                    Wgląd w Twoje wzorce i rekomendacje
                </ThemedText>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsSection}>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <IconSymbol name="list.bullet" size={20} color={Colors.light.tint} />
                        <ThemedText style={styles.statNumber}>{completionRate}%</ThemedText>
                        <ThemedText style={styles.statLabel}>Dzisiaj ukończone</ThemedText>
                    </View>

                    <View style={styles.statCard}>
                        <IconSymbol name="chart.bar.fill" size={20} color={Colors.light.tint} />
                        <ThemedText style={styles.statNumber}>{tasks.length}</ThemedText>
                        <ThemedText style={styles.statLabel}>Wszystkie zadania</ThemedText>
                    </View>

                    <View style={styles.statCard}>
                        <IconSymbol name="mic.fill" size={20} color={Colors.light.tint} />
                        <ThemedText style={styles.statNumber}>{voiceNotes.length}</ThemedText>
                        <ThemedText style={styles.statLabel}>Notatki głosowe</ThemedText>
                    </View>
                </View>
            </View>

            {/* Weekly Progress Chart */}
            <View style={styles.chartSection}>
                <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                    Postęp w tym tygodniu
                </ThemedText>
                <View style={styles.chartContainer}>
                    {weeklyProgress.map((day, index) => {
                        const maxHeight = 80;
                        const completedHeight = day.planned > 0 ? (day.completed / day.planned) * maxHeight : 0;

                        return (
                            <View key={day.day} style={styles.chartBar}>
                                <View style={styles.barContainer}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { height: completedHeight, backgroundColor: Colors.light.tint }
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.barBackground,
                                            { height: maxHeight - completedHeight }
                                        ]}
                                    />
                                </View>
                                <ThemedText style={styles.barLabel}>{day.day}</ThemedText>
                                <ThemedText style={styles.barValue}>
                                    {day.completed}/{day.planned}
                                </ThemedText>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* AI Insights */}
            <View style={styles.insightsSection}>
                <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                    Wglądy AI
                </ThemedText>

                {mockInsights.map((insight, index) => (
                    <TouchableOpacity key={index} style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <View style={styles.insightIcon}>
                                <IconSymbol name={insight.icon as any} size={20} color={Colors.light.tint} />
                            </View>
                            <View style={styles.insightContent}>
                                <ThemedText variant="titleSmall" style={styles.insightTitle}>
                                    {insight.title}
                                </ThemedText>
                                <View style={styles.confidenceContainer}>
                                    <View
                                        style={[
                                            styles.confidenceBar,
                                            { width: `${insight.confidence}%` }
                                        ]}
                                    />
                                    <ThemedText style={styles.confidenceText}>
                                        {insight.confidence}% pewności
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                        <ThemedText style={styles.insightDescription}>
                            {insight.description}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Predictions */}
            <View style={styles.predictionsSection}>
                <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                    Przewidywania AI
                </ThemedText>
                <View style={styles.predictionCard}>
                    <View style={styles.predictionHeader}>
                        <IconSymbol name="brain" size={24} color={Colors.light.tint} />
                        <ThemedText style={styles.predictionTitle}>
                            Przewidywana produktywność
                        </ThemedText>
                    </View>
                    <ThemedText style={styles.predictionDescription}>
                        Na podstawie Twoich wzorców, jutro prawdopodobnie ukończysz {Math.round(completionRate * 0.9)}% zadań
                    </ThemedText>
                    <View style={styles.predictionTips}>
                        <ThemedText style={styles.tipsTitle}>Wskazówki na jutro:</ThemedText>
                        <ThemedText style={styles.tipItem}>• Zaplanuj najważniejsze zadania na rano</ThemedText>
                        <ThemedText style={styles.tipItem}>• Rozważ krótkie przerwy co 45 minut</ThemedText>
                        <ThemedText style={styles.tipItem}>• Unikaj planowania więcej niż 7 zadań</ThemedText>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    disabledContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
    disabledView: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    disabledTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    disabledDescription: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 22,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.tint,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.6,
        textAlign: 'center',
        marginTop: 4,
    },
    chartSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: Colors.light.tint,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartBar: {
        alignItems: 'center',
        gap: 8,
    },
    barContainer: {
        height: 80,
        width: 20,
        justifyContent: 'flex-end',
    },
    barFill: {
        width: 20,
        borderRadius: 4,
    },
    barBackground: {
        width: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    barValue: {
        fontSize: 10,
        opacity: 0.5,
    },
    insightsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    insightCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    insightIcon: {
        width: 40,
        height: 40,
        backgroundColor: `${Colors.light.tint}15`,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    confidenceBar: {
        height: 4,
        backgroundColor: Colors.light.tint,
        borderRadius: 2,
        flex: 1,
        maxWidth: 60,
    },
    confidenceText: {
        fontSize: 12,
        opacity: 0.6,
    },
    insightDescription: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
    },
    predictionsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    predictionCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    predictionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    predictionDescription: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
        marginBottom: 16,
    },
    predictionTips: {
        gap: 4,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    tipItem: {
        fontSize: 13,
        opacity: 0.7,
        lineHeight: 18,
    },
});