import uuid from 'react-native-uuid';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactStats } from '@/components/compact-stats';
import { TaskList } from '@/components/daily/task-list';
import { AddHabitModal } from '@/components/habits/add-habit-modal';
import { HabitsView } from '@/components/habits/habits-view';
import { Sidebar } from '@/components/sidebar';
import { SubscriptionGate } from '@/components/subscription/subscription-gate';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
import { CreateHabitDto, HabitStatus, Task } from '@/lib/types';
import { useAppStore } from '@/stores/app-store';

type FilterType = 'all' | 'today' | 'completed' | 'pending';
type ViewType = 'routines' | 'habits';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (task: Omit<Task, 'id'>) => Promise<void>;
}

interface AddRoutineModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (routine: Omit<Task, 'id'>) => Promise<void>;
}

function AddRoutineModal({ visible, onClose, onSave }: AddRoutineModalProps) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
    const [routineType, setRoutineType] = React.useState<'morning' | 'evening' | 'exercise' | 'custom'>('custom');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setRoutineType('custom');
    };

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Błąd', 'Wprowadź nazwę rutyny');
            return;
        }

        const routine: Omit<Task, 'id'> = {
            title: title.trim(),
            description: description.trim() || `Moja ${title.toLowerCase()}`,
            priority,
            completed: false,
            category: 'routine',
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        onSave(routine);
        resetForm();
        onClose();
    };

    const handlePresetSelect = (preset: 'morning' | 'evening' | 'exercise') => {
        setRoutineType(preset);
        switch (preset) {
            case 'morning':
                setTitle('Poranna rutyna');
                setDescription('Moja codzienna poranna rutyna');
                break;
            case 'evening':
                setTitle('Wieczorna rutyna');
                setDescription('Moja codzienna wieczorna rutyna');
                break;
            case 'exercise':
                setTitle('Rutyna ćwiczeń');
                setDescription('Moja rutyna treningowa');
                break;
        }
    };

    if (!visible) return null;

    return (

        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Dodaj rutynę</ThemedText>
                    <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                        <IconSymbol name="xmark" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.formContainer}>
                    {/* Preset buttons */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Szybkie presety:</ThemedText>
                        <View style={styles.presetButtons}>
                            <TouchableOpacity
                                style={[styles.presetButton, routineType === 'morning' && styles.presetButtonActive]}
                                onPress={() => handlePresetSelect('morning')}
                            >
                                <IconSymbol name="sunrise" size={20} color={routineType === 'morning' ? '#fff' : '#666'} />
                                <Text style={[styles.presetButtonText, routineType === 'morning' && styles.presetButtonTextActive]}>
                                    Poranek
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.presetButton, routineType === 'evening' && styles.presetButtonActive]}
                                onPress={() => handlePresetSelect('evening')}
                            >
                                <IconSymbol name="moon" size={20} color={routineType === 'evening' ? '#fff' : '#666'} />
                                <Text style={[styles.presetButtonText, routineType === 'evening' && styles.presetButtonTextActive]}>
                                    Wieczór
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.presetButton, routineType === 'exercise' && styles.presetButtonActive]}
                                onPress={() => handlePresetSelect('exercise')}
                            >
                                <IconSymbol name="figure.run" size={20} color={routineType === 'exercise' ? '#fff' : '#666'} />
                                <Text style={[styles.presetButtonText, routineType === 'exercise' && styles.presetButtonTextActive]}>
                                    Ćwiczenia
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Title Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Nazwa rutyny *</ThemedText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="np. Poranna rutyna, Stretching..."
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Opis (opcjonalnie)</ThemedText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.textInput, styles.multilineInput]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Opisz szczegóły swojej rutyny..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>

                    {/* Priority Selection */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Priorytet</ThemedText>
                        <View style={styles.priorityContainer}>
                            {(['low', 'medium', 'high'] as const).map((p) => {
                                const priorityConfig = getPriorityConfig(p);
                                const isSelected = priority === p;
                                const backgroundColor = isSelected ? priorityConfig.color + '20' : Colors.light.background;

                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityButton,
                                            isSelected && styles.priorityButtonActive,
                                            { backgroundColor }
                                        ]}
                                        onPress={() => setPriority(p)}
                                    >
                                        <IconSymbol
                                            size={16}
                                            name={priorityConfig.icon}
                                            color={priorityConfig.color}
                                        />
                                        <ThemedText style={[styles.priorityText, { color: isSelected ? Colors.light.text : Colors.light.textSecondary }]}>
                                            {priorityConfig.label}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => { resetForm(); onClose(); }}
                    >
                        <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={handleSave}
                    >
                        <ThemedText style={styles.saveButtonText}>Dodaj rutynę</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function getPriorityConfig(priority: 'low' | 'medium' | 'high') {
    switch (priority) {
        case 'high':
            return { color: '#FF4444', icon: 'exclamationmark.triangle' as const, label: 'Wysoki' };
        case 'medium':
            return { color: '#FFA500', icon: 'minus.circle' as const, label: 'Średni' };
        case 'low':
            return { color: '#4CAF50', icon: 'checkmark.circle' as const, label: 'Niski' };
        default:
            return { color: '#4CAF50', icon: 'checkmark.circle' as const, label: 'Niski' };
    }
}

function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = React.useState<string>('');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
    };

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Błąd', 'Tytuł zadania jest wymagany');
            return;
        }

        const task: Omit<Task, 'id'> = {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            completed: false,
            dueDate: dueDate || undefined,
            category: 'general', // Dodanie kategorii
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        onAdd(task);
        resetForm();
        onClose();
    };

    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Dodaj nowe zadanie</ThemedText>
                    <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                        <IconSymbol size={24} name="xmark" color={Colors.light.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.formContainer}>
                    {/* Title Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Tytuł zadania *</ThemedText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Wprowadź tytuł zadania..."
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={100}
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Opis (opcjonalnie)</ThemedText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.textInput, styles.multilineInput]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Dodaj szczegóły zadania..."
                                placeholderTextColor={Colors.light.textSecondary}
                                multiline
                                numberOfLines={3}
                                maxLength={500}
                            />
                        </View>
                    </View>

                    {/* Priority Selection */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Priorytet</ThemedText>
                        <View style={styles.priorityContainer}>
                            {(['low', 'medium', 'high'] as const).map((p) => {
                                const priorityConfig = getPriorityConfig(p);
                                const isSelected = priority === p;
                                const backgroundColor = isSelected ? priorityConfig.color + '20' : Colors.light.background;

                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityButton,
                                            isSelected && styles.priorityButtonActive,
                                            { backgroundColor }
                                        ]}
                                        onPress={() => setPriority(p)}
                                    >
                                        <IconSymbol
                                            size={16}
                                            name={priorityConfig.icon}
                                            color={priorityConfig.color}
                                        />
                                        <ThemedText style={[styles.priorityText, { color: isSelected ? Colors.light.text : Colors.light.textSecondary }]}>
                                            {priorityConfig.label}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Due Date Input */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Termin (opcjonalnie)</ThemedText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                value={dueDate}
                                onChangeText={setDueDate}
                                placeholder="YYYY-MM-DD np. 2025-12-20"
                                placeholderTextColor={Colors.light.textSecondary}
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => { resetForm(); onClose(); }}
                    >
                        <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={handleSave}
                    >
                        <ThemedText style={styles.saveButtonText}>Dodaj zadanie</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default function RoutinesScreen() {
    const insets = useSafeAreaInsets();
    const { tasks, todaysTasks, loadTasks, addTask, addHabit } = useAppStore();
    const [currentView, setCurrentView] = React.useState<ViewType>('routines');
    const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showAddRoutineModal, setShowAddRoutineModal] = React.useState(false);
    const [showSidebar, setShowSidebar] = React.useState(false);
    const [showAddHabitModal, setShowAddHabitModal] = React.useState(false);

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
        setShowAddModal(true);
    };

    const handleTaskAdd = async (task: Omit<Task, 'id'>) => {
        try {
            const taskWithId: Task = {
                ...task,
                id: uuid.v4() as string
            };
            await addTask(taskWithId);
            Alert.alert('Sukces', 'Zadanie zostało dodane');
        } catch (error) {
            console.error('Błąd przy dodawaniu zadania:', error);
            Alert.alert('Błąd', 'Nie udało się dodać zadania');
        }
    };

    const handleAddRoutine = () => {
        setShowAddRoutineModal(true);
    };

    const handleRoutineAdd = async (routine: Omit<Task, 'id'>) => {
        try {
            const taskWithId: Task = {
                ...routine,
                id: uuid.v4() as string
            };
            await addTask(taskWithId);
            Alert.alert('Sukces', 'Rutyna została dodana');
        } catch (error) {
            console.error('Błąd przy dodawaniu rutyny:', error);
            Alert.alert('Błąd', 'Nie udało się dodać rutyny');
        }
    };

    const handleAddHabit = () => {
        setShowAddHabitModal(true);
    };

    const handleHabitAdd = async (habitData: CreateHabitDto) => {
        try {
            await addHabit(habitData);
            setShowAddHabitModal(false);
            Alert.alert('Sukces', 'Nawyk został dodany');
        } catch (error) {
            console.error('Błąd przy dodawaniu nawyku:', error);
            Alert.alert('Błąd', 'Nie udało się dodać nawyku');
        }
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
        <SubscriptionGate
            feature="routines_screen"
            screenTitle="Ekran główny"
        >
            <View style={styles.container}>

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <Pressable
                                onPress={() => setShowSidebar(true)}
                                style={({ pressed }) => [
                                    { padding: 4, borderRadius: 8 },
                                    pressed && { backgroundColor: Colors.light.tint + '20' }
                                ]}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <IconSymbol name="list.bullet" size={28} color={Colors.light.tint} />
                            </Pressable>
                            <ThemedText variant="headlineMedium" style={styles.title}>
                                Lista & Rutyny
                            </ThemedText>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={currentView === 'habits' ? handleAddHabit : handleAddTask}
                        >
                            <IconSymbol
                                name={currentView === 'habits' ? "plus.circle.fill" : "paperplane.fill"}
                                size={20}
                                color="white"
                            />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={styles.subtitle}>
                        Zarządzaj zadaniami i rutynami
                    </ThemedText>

                    {/* View Tabs */}
                    <View style={styles.viewTabs}>
                        <TouchableOpacity
                            style={[
                                styles.viewTab,
                                currentView === 'routines' && styles.viewTabActive
                            ]}
                            onPress={() => setCurrentView('routines')}
                        >
                            <ThemedText
                                style={[
                                    styles.viewTabText,
                                    currentView === 'routines' && styles.viewTabTextActive
                                ]}
                            >
                                Rutyny
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.viewTab,
                                currentView === 'habits' && styles.viewTabActive
                            ]}
                            onPress={() => setCurrentView('habits')}
                        >
                            <ThemedText
                                style={[
                                    styles.viewTabText,
                                    currentView === 'habits' && styles.viewTabTextActive
                                ]}
                            >
                                Nawyki
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content based on current view */}
                {currentView === 'routines' ? (
                    <>
                        {/* Filter Stats */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                gap: DesignSystem.spacing.sm,
                                paddingHorizontal: 20,
                                paddingVertical: 2,
                            }}
                            style={{
                                marginTop: 16,
                                marginBottom: 16,
                                maxHeight: 116,
                            }}
                        >
                            {filters.map((filter) => (
                                <View key={filter.key} style={{ width: 124, height: 110 }}>
                                    <CompactStats
                                        title={filter.label}
                                        count={filter.count}
                                        icon={
                                            filter.key === 'all' ? 'list.bullet' :
                                                filter.key === 'today' ? 'clock' :
                                                    filter.key === 'pending' ? 'circle' :
                                                        'checkmark.circle'
                                        }
                                        isActive={activeFilter === filter.key}
                                        onPress={() => setActiveFilter(filter.key as FilterType)}
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        {/* Content */}
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Quick Actions */}
                            <View style={[styles.quickActionsSection, { paddingVertical: 12 }]}>
                                <View style={styles.quickActionsRow}>
                                    <TouchableOpacity style={[styles.quickActionButton, { paddingVertical: 10 }]} onPress={handleAddTask}>
                                        <IconSymbol name="paperplane.fill" size={18} color={Colors.light.tint} />
                                        <ThemedText style={styles.quickActionText}>Dodaj zadanie</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.quickActionButton, { paddingVertical: 10 }]} onPress={handleAddRoutine}>
                                        <IconSymbol name="brain" size={18} color={Colors.light.tint} />
                                        <ThemedText style={styles.quickActionText}>Dodaj rutynę</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Tasks List */}
                            <View style={[styles.tasksSection, { paddingHorizontal: 20, paddingVertical: 12 }]}>
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
                            <View style={[styles.routinesSection, { paddingHorizontal: 20, paddingVertical: 12, marginBottom: 20 }]}>
                                <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                                    Rutyny
                                </ThemedText>
                                <View style={[styles.routinesPlaceholder, { paddingVertical: 16 }]}>
                                    <IconSymbol name="brain" size={24} color="#ccc" />
                                    <ThemedText style={[styles.placeholderText, { marginTop: 8 }]}>
                                        Funkcja rutyn zostanie wkrótce dodana
                                    </ThemedText>
                                    <ThemedText style={[styles.placeholderSubtext, { marginTop: 4 }]}>
                                        Będziesz mógł tworzyć powtarzalne zadania i nawyki
                                    </ThemedText>
                                </View>
                            </View>
                        </ScrollView>
                    </>
                ) : (
                    <HabitsView onAddHabit={handleAddHabit} />
                )}
                <AddTaskModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleTaskAdd}
                />

                {/* Add Habit Modal */}
                <AddHabitModal
                    visible={showAddHabitModal}
                    onClose={() => setShowAddHabitModal(false)}
                    onAdd={handleHabitAdd}
                />

                {/* Add Routine Modal */}
                <AddRoutineModal
                    visible={showAddRoutineModal}
                    onClose={() => setShowAddRoutineModal(false)}
                    onSave={handleRoutineAdd}
                />

                {/* Sidebar */}
                <Sidebar
                    visible={showSidebar}
                    onClose={() => setShowSidebar(false)}
                />
            </View>
        </SubscriptionGate>
    );
}

const styles = StyleSheet.create({
    // Modal styles for AddRoutineModal
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalScrollContent: {
        maxHeight: 400,
    },
    presetSection: {
        marginBottom: 20,
    },
    presetButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    presetButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        gap: 4,
    },
    presetButtonActive: {
        borderColor: Colors.light.tint,
        backgroundColor: Colors.light.tint,
    },
    presetButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    presetButtonTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8f8f8',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: Colors.light.tint,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    formSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    prioritySelector: {
        marginTop: 12,
    },
    priorityButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    selectedPriorityButton: {
        borderColor: Colors.light.tint,
        backgroundColor: Colors.light.tint + '20',
    },
    priorityButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    selectedPriorityButtonText: {
        color: Colors.light.tint,
        fontWeight: '600',
    },

    // Original styles continue below
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
    // Modal styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    formContainer: {
        maxHeight: 300,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: Colors.light.text,
    },
    inputContainer: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: Colors.light.background,
    },
    textInput: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: Colors.light.text,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    priorityButtonActive: {
        borderColor: Colors.light.tint,
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    tasksSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
    // View tabs styles
    viewTabs: {
        flexDirection: 'row',
        marginTop: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
    },
    viewTab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewTabActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    viewTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    viewTabTextActive: {
        color: Colors.light.tint,
        fontWeight: '600',
    },
});
