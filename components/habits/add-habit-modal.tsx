import React from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { CreateHabitDto, HabitCategory, HabitFrequency } from '@/lib/types';

interface AddHabitModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (habit: CreateHabitDto) => Promise<void>;
}

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
    [HabitFrequency.DAILY]: { label: 'Codziennie', color: '#10B981', icon: 'clock' },
    [HabitFrequency.WEEKLY]: { label: 'Tygodniowo', color: '#3B82F6', icon: 'calendar' },
    [HabitFrequency.MONTHLY]: { label: 'Miesięcznie', color: '#8B5CF6', icon: 'calendar.badge.clock' },
};

const commonHabits = [
    { name: 'Picie wody', description: '8 szklanek wody dziennie', category: HabitCategory.HEALTH, frequency: HabitFrequency.DAILY },
    { name: 'Ćwiczenia', description: '30 minut aktywności fizycznej', category: HabitCategory.FITNESS, frequency: HabitFrequency.DAILY },
    { name: 'Medytacja', description: '10 minut mindfulness', category: HabitCategory.MINDFULNESS, frequency: HabitFrequency.DAILY },
    { name: 'Czytanie', description: 'Przeczytaj 20 stron książki', category: HabitCategory.LEARNING, frequency: HabitFrequency.DAILY },
    { name: 'Planowanie dnia', description: 'Zaplanuj zadania na następny dzień', category: HabitCategory.PRODUCTIVITY, frequency: HabitFrequency.DAILY },
    { name: 'Sprzątanie', description: 'Utrzymuj porządek w mieszkaniu', category: HabitCategory.PERSONAL, frequency: HabitFrequency.WEEKLY },
];

export function AddHabitModal({ visible, onClose, onAdd }: AddHabitModalProps) {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [category, setCategory] = React.useState<HabitCategory>(HabitCategory.HEALTH);
    const [frequency, setFrequency] = React.useState<HabitFrequency>(HabitFrequency.DAILY);
    const [targetDays, setTargetDays] = React.useState('');
    const [reminderEnabled, setReminderEnabled] = React.useState(false);
    const [reminderTime, setReminderTime] = React.useState('09:00');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory(HabitCategory.HEALTH);
        setFrequency(HabitFrequency.DAILY);
        setTargetDays('');
        setReminderEnabled(false);
        setReminderTime('09:00');
    };

    const handlePresetSelect = (habit: typeof commonHabits[0]) => {
        setName(habit.name);
        setDescription(habit.description);
        setCategory(habit.category);
        setFrequency(habit.frequency);
    };

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert('Błąd walidacji', 'Nazwa nawyku jest wymagana');
            return false;
        }

        if (targetDays && (isNaN(Number(targetDays)) || Number(targetDays) < 1)) {
            Alert.alert('Błąd walidacji', 'Cel musi być liczbą większą od 0');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const habitData: CreateHabitDto = {
                name: name.trim(),
                description: description.trim() || undefined,
                category,
                frequency,
                targetDays: targetDays ? Number(targetDays) : undefined,
                reminderSettings: reminderEnabled ? {
                    enabled: true,
                    time: reminderTime,
                    days: frequency === HabitFrequency.DAILY ? [1, 2, 3, 4, 5, 6, 0] :
                        frequency === HabitFrequency.WEEKLY ? [1] : [1]
                } : undefined,
            };

            await onAdd(habitData);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error creating habit:', error);
            Alert.alert('Błąd', 'Nie udało się utworzyć nawyku. Spróbuj ponownie.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={() => {
                resetForm();
                onClose();
            }}
            statusBarTranslucent={true}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>                    {/* Modal Handle */}
                    <View style={styles.modalHandle} />
                                    <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Nowy nawyk</ThemedText>
                    <TouchableOpacity
                        onPress={() => { resetForm(); onClose(); }}
                        style={styles.closeButton}
                    >
                        <IconSymbol name="xmark" size={24} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                    {/* Quick Presets */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Szybkie szablony</ThemedText>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.presetsContainer}
                            contentContainerStyle={styles.presetsContent}
                        >
                            {commonHabits.map((habit, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.presetCard,
                                        { borderColor: categoryConfig[habit.category].color + '40' }
                                    ]}
                                    onPress={() => handlePresetSelect(habit)}
                                >
                                    <View style={[
                                        styles.presetIcon,
                                        { backgroundColor: categoryConfig[habit.category].color + '20' }
                                    ]}>
                                        <IconSymbol
                                            name={categoryConfig[habit.category].icon}
                                            size={20}
                                            color={categoryConfig[habit.category].color}
                                        />
                                    </View>
                                    <ThemedText style={styles.presetName}>{habit.name}</ThemedText>
                                    <ThemedText style={styles.presetDescription} numberOfLines={2}>
                                        {habit.description}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Basic Information */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Podstawowe informacje</ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Nazwa nawyku *</ThemedText>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="np. Codzienny spacer"
                                    placeholderTextColor={Colors.light.textSecondary}
                                    maxLength={100}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Opis (opcjonalnie)</ThemedText>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.textInput, styles.multilineInput]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Opisz szczegóły swojego nawyku..."
                                    placeholderTextColor={Colors.light.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                    maxLength={500}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Category Selection */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Kategoria</ThemedText>
                        <View style={styles.categoryGrid}>
                            {Object.entries(categoryConfig).map(([key, config]) => {
                                const isSelected = category === key;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.categoryButton,
                                            isSelected && styles.categoryButtonActive,
                                            { borderColor: config.color + '40' }
                                        ]}
                                        onPress={() => setCategory(key as HabitCategory)}
                                    >
                                        <View style={[
                                            styles.categoryIcon,
                                            { backgroundColor: isSelected ? config.color : config.color + '20' }
                                        ]}>
                                            <IconSymbol
                                                name={config.icon}
                                                size={18}
                                                color={isSelected ? 'white' : config.color}
                                            />
                                        </View>
                                        <ThemedText style={[
                                            styles.categoryLabel,
                                            { color: isSelected ? config.color : Colors.light.text }
                                        ]}>
                                            {config.label}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Frequency Selection */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Częstotliwość</ThemedText>
                        <View style={styles.frequencyContainer}>
                            {Object.entries(frequencyConfig).map(([key, config]) => {
                                const isSelected = frequency === key;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.frequencyButton,
                                            isSelected && [styles.frequencyButtonActive, { backgroundColor: config.color + '20' }]
                                        ]}
                                        onPress={() => setFrequency(key as HabitFrequency)}
                                    >
                                        <IconSymbol
                                            name={config.icon}
                                            size={16}
                                            color={isSelected ? config.color : Colors.light.textSecondary}
                                        />
                                        <ThemedText style={[
                                            styles.frequencyLabel,
                                            { color: isSelected ? config.color : Colors.light.text }
                                        ]}>
                                            {config.label}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Advanced Options */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Opcje zaawansowane</ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Cel (dni)</ThemedText>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={targetDays}
                                    onChangeText={setTargetDays}
                                    placeholder="np. 30 (opcjonalnie)"
                                    placeholderTextColor={Colors.light.textSecondary}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.reminderSection}>
                            <TouchableOpacity
                                style={styles.reminderToggle}
                                onPress={() => setReminderEnabled(!reminderEnabled)}
                            >
                                <View style={styles.reminderToggleLeft}>
                                    <IconSymbol
                                        name="bell"
                                        size={20}
                                        color={reminderEnabled ? Colors.light.tint : Colors.light.textSecondary}
                                    />
                                    <ThemedText style={styles.reminderToggleLabel}>
                                        Przypomnienia
                                    </ThemedText>
                                </View>
                                <View style={[
                                    styles.toggle,
                                    reminderEnabled && styles.toggleActive
                                ]}>
                                    <View style={[
                                        styles.toggleThumb,
                                        reminderEnabled && styles.toggleThumbActive
                                    ]} />
                                </View>
                            </TouchableOpacity>

                            {reminderEnabled && (
                                <View style={styles.reminderTimeContainer}>
                                    <ThemedText style={styles.inputLabel}>Godzina przypomnienia</ThemedText>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.textInput}
                                            value={reminderTime}
                                            onChangeText={setReminderTime}
                                            placeholder="09:00"
                                            placeholderTextColor={Colors.light.textSecondary}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => { resetForm(); onClose(); }}
                        disabled={isSubmitting}
                    >
                        <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.saveButton,
                            isSubmitting && styles.saveButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <ThemedText style={styles.saveButtonText}>
                            {isSubmitting ? 'Tworzenie...' : 'Utwórz nawyk'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        maxHeight: '90%',
        paddingBottom: 34, // Safe area for bottom
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E5E5',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    closeButton: {
        padding: 4,
        borderRadius: 8,
    },
    formContainer: {
        maxHeight: '70%',
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 12,
    },
    presetsContainer: {
        marginTop: 8,
    },
    presetsContent: {
        paddingRight: 20,
    },
    presetCard: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        width: 120,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    presetIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    presetName: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
        color: Colors.light.text,
    },
    presetDescription: {
        fontSize: 10,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 14,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: Colors.light.text,
    },
    inputContainer: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fafafa',
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.light.text,
        backgroundColor: 'transparent',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#fafafa',
        minWidth: '47%',
        gap: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#f8f9ff',
        borderWidth: 2,
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    frequencyContainer: {
        gap: 8,
    },
    frequencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 12,
    },
    frequencyButtonActive: {
        borderWidth: 2,
    },
    frequencyLabel: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    reminderSection: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 16,
        marginTop: 8,
    },
    reminderToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    reminderToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reminderToggleLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.text,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e0e0e0',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: Colors.light.tint,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumbActive: {
        marginLeft: 20,
    },
    reminderTimeContainer: {
        marginTop: 12,
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    saveButton: {
        backgroundColor: Colors.light.tint,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.light.tint + '60',
    },
    cancelButtonText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});