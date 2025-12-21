import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AddHabitModal } from '@/components/habits/add-habit-modal';
import { HabitCharts } from '@/components/habits/habit-charts';
import { HabitDetailsModal } from '@/components/habits/habit-details-modal';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { CreateHabitDto, Habit, HabitCategory, HabitFrequency, HabitStatus } from '@/lib/types';
import { useAppStore } from '@/stores/app-store';



const categoryConfig = {
    [HabitCategory.HEALTH]: { color: '#10B981', icon: 'heart.fill', label: 'Zdrowie' },
    [HabitCategory.PRODUCTIVITY]: { color: '#3B82F6', icon: 'clock.fill', label: 'Produktywność' },
    [HabitCategory.LEARNING]: { color: '#8B5CF6', icon: 'book.fill', label: 'Nauka' },
    [HabitCategory.PERSONAL]: { color: '#F59E0B', icon: 'person.fill', label: 'Osobiste' },
    [HabitCategory.FITNESS]: { color: '#EF4444', icon: 'figure.run', label: 'Fitness' },
    [HabitCategory.MINDFULNESS]: { color: '#A855F7', icon: 'brain', label: 'Mindfulness' },
    [HabitCategory.SOCIAL]: { color: '#06B6D4', icon: 'person.2', label: 'Społeczne' },
    [HabitCategory.FINANCIAL]: { color: '#84CC16', icon: 'dollarsign.circle', label: 'Finanse' },
};

const frequencyConfig = {
    [HabitFrequency.DAILY]: { label: 'Codziennie', color: '#10B981' },
    [HabitFrequency.WEEKLY]: { label: 'Tygodniowo', color: '#3B82F6' },
    [HabitFrequency.MONTHLY]: { label: 'Miesięcznie', color: '#8B5CF6' },
};

interface HabitsViewProps {
    onAddHabit?: () => void;
}

export function HabitsView({ onAddHabit }: HabitsViewProps = {}) {
    const {
        habits,
        habitStats,
        isLoadingHabits,
        habitActionStates,
        completeHabit,
        uncompleteHabit,
        loadHabits,
        loadHabitStats,
        addHabit,
        deleteHabit,
        error,
        clearError
    } = useAppStore();

    const [filter, setFilter] = React.useState<'all' | 'completed' | 'pending'>('all');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showDetailsModal, setShowDetailsModal] = React.useState(false);
    const [selectedHabit, setSelectedHabit] = React.useState<Habit | null>(null);
    const [chartPeriod, setChartPeriod] = React.useState<'week' | 'month' | 'year'>('week');
    const [showCharts, setShowCharts] = React.useState(true); // Wykresy domyślnie widoczne

    // Load data on mount
    React.useEffect(() => {
        loadHabits();
        loadHabitStats();
    }, []);

    // Clear errors when component unmounts
    React.useEffect(() => {
        return () => {
            clearError();
        };
    }, []);

    const filteredHabits = React.useMemo(() => {
        switch (filter) {
            case 'completed':
                return habits.filter(habit => habit.isCompletedToday || habit.isCompletedForPeriod);
            case 'pending':
                return habits.filter(habit => !(habit.isCompletedToday || habit.isCompletedForPeriod));
            default:
                return habits;
        }
    }, [habits, filter]);

    const toggleHabitCompletion = async (habitId: string) => {
        try {
            const habit = habits.find(h => h.id === habitId);
            if (!habit) return;

            // Prevent multiple clicks while action is in progress
            const actionState = habitActionStates?.[habitId];
            if (actionState?.isLoading) {
                return; // Action already in progress
            }

            const isCurrentlyCompleted = habit.isCompletedToday || habit.isCompletedForPeriod;

            if (isCurrentlyCompleted) {
                await uncompleteHabit(habitId);
                // Success feedback is handled by the store (haptic)
            } else {
                await completeHabit(habitId);
                // Success feedback is handled by the store (haptic + animation)
            }
        } catch (error) {
            console.error('Failed to toggle habit completion:', error);

            // Show user-friendly error message for common cases
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('already completed on this date')) {
                Alert.alert(
                    'Już wykonane',
                    'Ten nawyk został już wykonany w tym okresie.',
                    [{ text: 'OK', style: 'default' }]
                );
            } else {
                Alert.alert(
                    'Błąd',
                    'Nie udało się zaktualizować statusu nawyku. Spróbuj ponownie.',
                    [{ text: 'OK', style: 'default' }]
                );
            }
        }
    };

    const handleAddHabit = () => {
        if (onAddHabit) {
            onAddHabit();
        } else {
            setShowAddModal(true);
        }
    };

    const handleHabitAdd = async (habitData: CreateHabitDto) => {
        try {
            const habitToAdd = {
                name: habitData.name,
                description: habitData.description,
                frequency: habitData.frequency,
                category: habitData.category,
                status: 'active' as HabitStatus,
                currentStreak: 0,
                longestStreak: 0,
                totalCompletions: 0,
                lastCompletedAt: undefined,
                targetDays: habitData.targetDays,
                reminderSettings: habitData.reminderSettings,
                customFields: habitData.customFields,
            };
            await addHabit(habitToAdd);
            Alert.alert('Sukces', 'Nawyk został pomyślnie utworzony.');
        } catch (error) {
            console.error('Failed to create habit:', error);
            Alert.alert('Błąd', 'Nie udało się utworzyć nawyku. Spróbuj ponownie.');
        }
    };

    const handleHabitDetails = (habit: Habit) => {
        setSelectedHabit(habit);
        setShowDetailsModal(true);
    };

    const handleHabitEdit = (habit: Habit) => {
        // TODO: Implement edit functionality
        Alert.alert('Edycja nawyków', 'Funkcjonalność edycji zostanie wkrótce dodana');
    };

    const handleHabitDelete = async (habitId: string) => {
        try {
            await deleteHabit(habitId);
            Alert.alert('Sukces', 'Nawyk został usunięty.');
        } catch (error) {
            console.error('Failed to delete habit:', error);
            Alert.alert('Błąd', 'Nie udało się usunąć nawyku.');
        }
    };

    const handleRefresh = () => {
        loadHabits();
        loadHabitStats();
    };

    const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
        <View style={[styles.statsCard, { borderLeftColor: color }]}>
            <View style={styles.statsCardHeader}>
                <IconSymbol name={icon} size={20} color={color} />
                <ThemedText style={[styles.statsValue, { color }]}>{value}</ThemedText>
            </View>
            <ThemedText style={styles.statsTitle}>{title}</ThemedText>
        </View>
    );

    const renderHabitCard = (habit: Habit, index: number) => {
        const categoryInfo = categoryConfig[habit.category] || {
            color: '#666666',
            icon: 'circle' as const,
            label: 'Inne'
        };
        const frequencyInfo = frequencyConfig[habit.frequency] || {
            label: 'Nieznana',
            color: '#666666'
        };

        const completionPercentage = Math.round(habit.completionRate || 0);
        const isCompleted = habit.isCompletedToday || habit.isCompletedForPeriod;

        return (
            <TouchableOpacity
                key={habit.id ? `habit-${habit.id}` : `habit-item-${index}`}
                style={styles.habitCard}
                onPress={() => handleHabitDetails(habit)}
                activeOpacity={0.7}
            >
                <View style={styles.habitHeader}>
                    <View style={styles.habitInfo}>
                        <View style={styles.habitTitleRow}>
                            <View style={[styles.categoryBadge, { backgroundColor: (categoryInfo?.color || '#666666') + '15' }]}>
                                <IconSymbol name={categoryInfo?.icon || 'circle'} size={14} color={categoryInfo?.color || '#666666'} />
                            </View>
                            <ThemedText style={styles.habitName} numberOfLines={1} ellipsizeMode="tail">
                                {habit.name}
                            </ThemedText>
                        </View>
                        {habit.description && (
                            <ThemedText style={styles.habitDescription} numberOfLines={2} ellipsizeMode="tail">
                                {habit.description}
                            </ThemedText>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.completionButton,
                            isCompleted && styles.completionButtonActive,
                            (habit as any)._justCompleted && styles.completionButtonJustCompleted,
                            { borderColor: categoryInfo?.color || '#666666' },
                            (habitActionStates?.[habit.id]?.isLoading && styles.completionButtonLoading)
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleHabitCompletion(habit.id);
                        }}
                        disabled={isLoadingHabits || habitActionStates?.[habit.id]?.isLoading}
                        activeOpacity={0.7}
                    >
                        {habitActionStates?.[habit.id]?.isLoading ? (
                            <View style={styles.loadingIndicator}>
                                <View style={styles.loadingSpinner} />
                            </View>
                        ) : isCompleted ? (
                            <IconSymbol name="checkmark" size={16} color="white" />
                        ) : null}
                    </TouchableOpacity>
                </View >

                <View style={styles.habitFooter}>
                    <View style={styles.habitMetrics}>
                        <View style={styles.metric}>
                            <IconSymbol name="flame.fill" size={14} color="#F59E0B" />
                            <ThemedText style={styles.metricText}>{habit.currentStreak} dni</ThemedText>
                        </View>
                        <View style={styles.metric}>
                            <IconSymbol name="calendar" size={14} color={frequencyInfo?.color || '#666666'} />
                            <ThemedText style={styles.metricText}>{frequencyInfo?.label || 'Nieznana'}</ThemedText>
                        </View>
                        <View style={styles.metric}>
                            <IconSymbol name="chart.bar.fill" size={14} color="#10B981" />
                            <ThemedText style={styles.metricText}>{completionPercentage}%</ThemedText>
                        </View>
                        <View style={styles.metric}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#6B7280" />
                            <ThemedText style={styles.metricText}>{habit.totalCompletions}</ThemedText>
                        </View>
                    </View>
                </View>
            </TouchableOpacity >
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <ThemedText style={styles.headerTitle}>Śledzenie nawyków</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            Buduj lepsze nawyki dzień po dniu
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={styles.chartsToggle}
                        onPress={() => setShowCharts(!showCharts)}
                    >
                        <IconSymbol
                            name={showCharts ? "chart.bar.fill" : "chart.bar"}
                            size={20}
                            color={Colors.light.tint}
                        />
                        <ThemedText style={styles.chartsToggleText}>
                            {showCharts ? 'Ukryj' : 'Wykresy'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Charts Section */}
            {showCharts && (
                <HabitCharts
                    habitStats={habitStats}
                    selectedPeriod={chartPeriod}
                    onPeriodChange={setChartPeriod}
                />
            )}

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {renderStatsCard('Aktywne nawyki', habitStats?.totalHabits || 0, 'list.bullet', '#3B82F6')}
                {renderStatsCard('Aktualna passa', `${habitStats?.currentActiveStreak || 0} dni`, 'flame.fill', '#F59E0B')}
                {renderStatsCard('Skuteczność', `${Math.round(habitStats?.averageCompletionRate || 0)}%`, 'chart.bar', '#10B981')}
                {renderStatsCard('Najdłuższa passa', `${habitStats?.longestStreak || 0} dni`, 'trophy', '#EF4444')}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                {[
                    { key: 'all', label: 'Wszystkie', count: habits.length },
                    {
                        key: 'completed',
                        label: 'Gotowe',
                        count: habits.filter(h => h.isCompletedToday || h.isCompletedForPeriod).length
                    },
                    {
                        key: 'pending',
                        label: 'Do zrobienia',
                        count: habits.filter(h => !(h.isCompletedToday || h.isCompletedForPeriod)).length
                    },
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.filterTab,
                            filter === tab.key && styles.filterTabActive
                        ]}
                        onPress={() => setFilter(tab.key as typeof filter)}
                    >
                        <ThemedText style={[
                            styles.filterTabText,
                            filter === tab.key && styles.filterTabTextActive
                        ]}>
                            {tab.label}
                        </ThemedText>
                        <View style={[
                            styles.filterTabBadge,
                            filter === tab.key && styles.filterTabBadgeActive
                        ]}>
                            <ThemedText style={[
                                styles.filterTabBadgeText,
                                filter === tab.key && styles.filterTabBadgeTextActive
                            ]}>
                                {tab.count}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Habits List */}
            <View style={styles.habitsContainer}>
                {filteredHabits.length > 0 ? (
                    filteredHabits.map((habit, index) => renderHabitCard(habit, index))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="calendar.badge.plus" size={48} color="#ccc" />
                        <ThemedText style={styles.emptyTitle}>
                            {filter === 'all' ? 'Brak nawyków' :
                                filter === 'completed' ? 'Brak gotowych nawyków' :
                                    'Brak nawyków do zrobienia'}
                        </ThemedText>
                        <ThemedText style={styles.emptyDescription}>
                            {filter === 'all'
                                ? 'Zacznij budować lepsze nawyki już dziś'
                                : filter === 'completed'
                                    ? 'Ukończ pierwszy nawyk, aby zobaczyć go tutaj'
                                    : 'Świetna robota! Wszystkie nawyki zostały ukończone'}
                        </ThemedText>
                    </View>
                )}
            </View>

            {/* Add Habit Button */}
            <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
                <IconSymbol name="plus" size={20} color="white" />
                <ThemedText style={styles.addButtonText}>Dodaj nowy nawyk</ThemedText>
            </TouchableOpacity>

            {/* Modals */}
            <AddHabitModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleHabitAdd}
            />

            <HabitDetailsModal
                habit={selectedHabit}
                visible={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedHabit(null);
                }}
                onEdit={handleHabitEdit}
                onDelete={handleHabitDelete}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    chartsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.light.tint + '10',
        borderRadius: 8,
        gap: 6,
    },
    chartsToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.tint,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
    },
    statsCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statsValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsTitle: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    filterTabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 6,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterTabActive: {
        backgroundColor: Colors.light.tint,
        borderColor: Colors.light.tint,
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
        flexShrink: 1,
    },
    filterTabTextActive: {
        color: 'white',
    },
    filterTabBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        flexShrink: 0,
    },
    filterTabBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    filterTabBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
    },
    filterTabBadgeTextActive: {
        color: 'white',
    },
    habitsContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    habitCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    habitHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    habitInfo: {
        flex: 1,
        marginRight: 12,
    },
    habitTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 10,
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        flex: 1,
    },
    habitDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    completionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    completionButtonActive: {
        backgroundColor: Colors.light.tint,
        borderColor: Colors.light.tint,
        transform: [{ scale: 1.05 }],
    },
    completionButtonJustCompleted: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        transform: [{ scale: 1.1 }],
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    completionButtonLoading: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    loadingIndicator: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSpinner: {
        width: 12,
        height: 12,
        borderWidth: 2,
        borderColor: Colors.light.tint,
        borderTopColor: 'transparent',
        borderRadius: 6,
    },
    habitFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    habitMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    emptyDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        left: 20,
        backgroundColor: Colors.light.tint,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        marginBottom: 8,
    },
    retryButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#dc2626',
        borderRadius: 6,
    },
    retryText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    refreshIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    refreshText: {
        fontSize: 14,
        color: '#666',
    },
});