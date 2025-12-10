import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/stores/app-store';

export default function AIScreen() {
    const insets = useSafeAreaInsets();
    const {
        recommendations,
        tasks,
        todaysTasks,
        voiceNotes
    } = useAppStore();

    // Analiza danych dla statystyk
    const completedTasks = todaysTasks.filter(t => t.completed);
    const completionRate = todaysTasks.length > 0 ? Math.round((completedTasks.length / todaysTasks.length) * 100) : 0;

    // Symulacja danych analitycznych (w prawdziwej aplikacji z AI)
    const mockInsights = [
        {
            type: 'productivity',
            title: 'Najlepszy czas na zadania',
            description: 'Twoja produktywność jest najwyższa między 9:00 a 11:00',
            confidence: 85,
            icon: 'chart.bar.fill'
        },
        {
            type: 'pattern',
            title: 'Wzorzec wykonywania zadań',
            description: 'Najczęściej wykonujesz zadania w środy i piątki',
            confidence: 72,
            icon: 'brain'
        },
        {
            type: 'suggestion',
            title: 'Optymalizacja rutyny',
            description: 'Rozważ podzielenie długich zadań na krótsze sesje',
            confidence: 90,
            icon: 'paperplane.fill'
        }
    ];

    const weeklyProgress = [
        { day: 'Pon', completed: 3, planned: 5 },
        { day: 'Wto', completed: 4, planned: 4 },
        { day: 'Śro', completed: 2, planned: 6 },
        { day: 'Czw', completed: 5, planned: 5 },
        { day: 'Pią', completed: 6, planned: 7 },
        { day: 'Sob', completed: 2, planned: 3 },
        { day: 'Nie', completed: completedTasks.length, planned: todaysTasks.length },
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
                    <View style={styles.headerContent}>
                        <IconSymbol name="brain" size={32} color={Colors.light.tint} />
                        <ThemedText variant="headlineMedium" style={styles.title}>
                            Analiza AI
                        </ThemedText>
                    </View>
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
                                    <View style={[styles.chartBarContainer, { height: maxHeight }]}>
                                        <View
                                            style={[
                                                styles.chartBarFill,
                                                { height: completedHeight, backgroundColor: Colors.light.tint }
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.chartBarBackground,
                                                { height: maxHeight - completedHeight }
                                            ]}
                                        />
                                    </View>
                                    <ThemedText style={styles.chartLabel}>{day.day}</ThemedText>
                                    <ThemedText style={styles.chartValue}>
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
                        Wgląd AI
                    </ThemedText>
                    <View style={styles.insightsContainer}>
                        {mockInsights.map((insight, index) => (
                            <View key={`insight-${index}`} style={styles.insightCard}>
                                <View style={styles.insightHeader}>
                                    <IconSymbol name={insight.icon as any} size={20} color={Colors.light.tint} />
                                    <ThemedText style={styles.insightTitle}>{insight.title}</ThemedText>
                                    <View style={styles.confidenceBadge}>
                                        <ThemedText style={styles.confidenceText}>
                                            {insight.confidence}%
                                        </ThemedText>
                                    </View>
                                </View>
                                <ThemedText style={styles.insightDescription}>
                                    {insight.description}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recommendations */}
                <View style={styles.recommendationsSection}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Rekomendacje
                    </ThemedText>
                    {recommendations.length > 0 ? (
                        <View style={styles.recommendationsContainer}>
                            {recommendations.map((recommendation, index) => (
                                <TouchableOpacity key={`recommendation-${index}`} style={styles.recommendationCard}>
                                    <View style={styles.recommendationHeader}>
                                        <IconSymbol name="paperplane.fill" size={18} color={Colors.light.tint} />
                                        <ThemedText style={styles.recommendationTitle}>
                                            {recommendation.title}
                                        </ThemedText>
                                    </View>
                                    <ThemedText style={styles.recommendationDescription}>
                                        {recommendation.description}
                                    </ThemedText>
                                    {recommendation.reason && (
                                        <ThemedText style={styles.recommendationReason}>
                                            💡 {recommendation.reason}
                                        </ThemedText>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyRecommendations}>
                            <IconSymbol name="brain" size={48} color="#ccc" />
                            <ThemedText style={styles.emptyTitle}>
                                Brak rekomendacji
                            </ThemedText>
                            <ThemedText style={styles.emptyDescription}>
                                AI potrzebuje więcej danych, aby wygenerować spersonalizowane rekomendacje
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Predictions */}
                <View style={styles.predictionsSection}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Przewidywania
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
                            <ThemedText style={styles.tipsTitle}>💡 Wskazówki na jutro:</ThemedText>
                            <ThemedText style={styles.tipItem}>• Zaplanuj najważniejsze zadania na rano</ThemedText>
                            <ThemedText style={styles.tipItem}>• Rozważ krótkie przerwy co 45 minut</ThemedText>
                            <ThemedText style={styles.tipItem}>• Unikaj planowania więcej niż 7 zadań</ThemedText>
                        </View>
                    </View>
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
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    title: {
        color: '#333',
    },
    subtitle: {
        textAlign: 'center',
        opacity: 0.7,
        fontSize: 14,
    },
    statsSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.7,
        textAlign: 'center',
    },
    chartSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 16,
        color: '#333',
    },
    chartContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartBar: {
        alignItems: 'center',
        gap: 4,
    },
    chartBarContainer: {
        width: 24,
        flexDirection: 'column-reverse',
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    chartBarFill: {
        width: '100%',
        borderRadius: 4,
    },
    chartBarBackground: {
        width: '100%',
        backgroundColor: '#f0f0f0',
    },
    chartLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    chartValue: {
        fontSize: 10,
        opacity: 0.6,
    },
    insightsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    insightsContainer: {
        gap: 12,
    },
    insightCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    insightTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    confidenceBadge: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    confidenceText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    insightDescription: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
    },
    recommendationsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    recommendationsContainer: {
        gap: 12,
    },
    recommendationCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    recommendationTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    recommendationDescription: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
        marginBottom: 8,
    },
    recommendationReason: {
        fontSize: 13,
        opacity: 0.7,
        fontStyle: 'italic',
    },
    emptyRecommendations: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        opacity: 0.8,
    },
    emptyDescription: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 20,
    },
    predictionsSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
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