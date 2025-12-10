import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskList } from '@/components/daily/task-list';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/stores/app-store';

type FilterType = 'all' | 'today' | 'completed' | 'pending';

export default function RoutinesScreen() {
    const insets = useSafeAreaInsets();
    const { tasks, todaysTasks, loadTasks } = useAppStore();
    const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');

    React.useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const getFilteredTasks = () => {
        switch (activeFilter) {
            case 'today':
                return todaysTasks;
            case 'completed':
                return tasks.filter(task => task.completed);
            case 'pending':
                return tasks.filter(task => !task.completed);
            default:
                return tasks;
        }
    };

    const filteredTasks = getFilteredTasks();

    const filters = [
        { key: 'all', label: 'Wszystkie', count: tasks.length },
        { key: 'today', label: 'Dzisiaj', count: todaysTasks.length },
        { key: 'pending', label: 'Do zrobienia', count: tasks.filter(t => !t.completed).length },
        { key: 'completed', label: 'Wykonane', count: tasks.filter(t => t.completed).length },
    ] as const;

    const handleAddTask = () => {
        Alert.alert(
            'Dodaj zadanie',
            'Ta funkcja zostanie wkrótce dodana',
            [{ text: 'OK' }]
        );
    };

    const handleAddRoutine = () => {
        Alert.alert(
            'Dodaj rutynę',
            'Ta funkcja zostanie wkrótce dodana',
            [{ text: 'OK' }]
        );
    };

    const renderFilterTab = (filter: { key: string; label: string; count: number }) => (
        <TouchableOpacity
            key={filter.key}
            style={[
                styles.filterTab,
                activeFilter === filter.key && styles.filterTabActive
            ]}
            onPress={() => setActiveFilter(filter.key as FilterType)}
        >
            <ThemedText
                style={[
                    styles.filterTabText,
                    activeFilter === filter.key && styles.filterTabTextActive
                ]}
            >
                {filter.label}
            </ThemedText>
            <View style={[
                styles.filterTabBadge,
                activeFilter === filter.key && styles.filterTabBadgeActive
            ]}>
                <ThemedText
                    style={[
                        styles.filterTabBadgeText,
                        activeFilter === filter.key && styles.filterTabBadgeTextActive
                    ]}
                >
                    {filter.count}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <IconSymbol name="list.bullet" size={28} color={Colors.light.tint} />
                        <ThemedText variant="headlineMedium" style={styles.title}>
                            Lista & Rutyny
                        </ThemedText>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                        <IconSymbol name="paperplane.fill" size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <ThemedText style={styles.subtitle}>
                    Zarządzaj zadaniami i rutynami
                </ThemedText>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
                style={styles.filtersScroll}
            >
                {filters.map((filter) => renderFilterTab(filter))}
            </ScrollView>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity style={styles.quickActionButton} onPress={handleAddTask}>
                            <IconSymbol name="paperplane.fill" size={18} color={Colors.light.tint} />
                            <ThemedText style={styles.quickActionText}>Dodaj zadanie</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionButton} onPress={handleAddRoutine}>
                            <IconSymbol name="brain" size={18} color={Colors.light.tint} />
                            <ThemedText style={styles.quickActionText}>Dodaj rutynę</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tasks List */}
                <View style={styles.tasksSection}>
                    <View style={styles.tasksSectionHeader}>
                        <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                            {activeFilter === 'all' && 'Wszystkie zadania'}
                            {activeFilter === 'today' && 'Zadania na dziś'}
                            {activeFilter === 'completed' && 'Wykonane zadania'}
                            {activeFilter === 'pending' && 'Zadania do wykonania'}
                        </ThemedText>
                        <ThemedText style={styles.tasksCount}>
                            {filteredTasks.length} {filteredTasks.length === 1 ? 'zadanie' : 'zadań'}
                        </ThemedText>
                    </View>

                    {filteredTasks.length > 0 ? (
                        <TaskList
                            tasks={filteredTasks}
                            showCompleted={activeFilter !== 'pending'}
                            emptyMessage={`Brak zadań w kategorii "${filters.find(f => f.key === activeFilter)?.label}"`}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <IconSymbol
                                name={activeFilter === 'completed' ? 'list.bullet' : 'paperplane.fill'}
                                size={48}
                                color="#ccc"
                            />
                            <ThemedText style={styles.emptyTitle}>
                                {activeFilter === 'completed' ? 'Brak wykonanych zadań' : 'Brak zadań'}
                            </ThemedText>
                            <ThemedText style={styles.emptyDescription}>
                                {activeFilter === 'completed'
                                    ? 'Wykonaj pierwsze zadanie, aby zobaczyć je tutaj'
                                    : 'Nagraj notatkę głosową lub dodaj zadanie ręcznie'
                                }
                            </ThemedText>
                            {activeFilter !== 'completed' && (
                                <TouchableOpacity style={styles.emptyActionButton} onPress={handleAddTask}>
                                    <ThemedText style={styles.emptyActionText}>Dodaj pierwsze zadanie</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Rutyny Section (placeholder) */}
                <View style={styles.routinesSection}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Rutyny
                    </ThemedText>
                    <View style={styles.routinesPlaceholder}>
                        <IconSymbol name="brain" size={32} color="#ccc" />
                        <ThemedText style={styles.placeholderText}>
                            Funkcja rutyn zostanie wkrótce dodana
                        </ThemedText>
                        <ThemedText style={styles.placeholderSubtext}>
                            Będziesz mógł tworzyć powtarzalne zadania i nawyki
                        </ThemedText>
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 60, // Will be overridden with dynamic style
        paddingBottom: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        color: '#333',
    },
    subtitle: {
        opacity: 0.7,
        fontSize: 14,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.light.tint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersScroll: {
        backgroundColor: 'white',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 8,
    },
    filterTabActive: {
        backgroundColor: Colors.light.tint,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    filterTabTextActive: {
        color: 'white',
    },
    filterTabBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'white',
        minWidth: 20,
        alignItems: 'center',
    },
    filterTabBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    filterTabBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
    filterTabBadgeTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
    },
    quickActionsSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionText: {
        color: Colors.light.tint,
        fontSize: 14,
        fontWeight: '500',
    },
    tasksSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    tasksSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#333',
    },
    tasksCount: {
        fontSize: 14,
        opacity: 0.6,
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
        opacity: 0.8,
    },
    emptyDescription: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 20,
    },
    emptyActionButton: {
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.light.tint,
        borderRadius: 20,
    },
    emptyActionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    routinesSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    routinesPlaceholder: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: 'white',
        borderRadius: 12,
        gap: 8,
    },
    placeholderText: {
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
    },
    placeholderSubtext: {
        fontSize: 14,
        opacity: 0.5,
        textAlign: 'center',
        lineHeight: 20,
    },
});