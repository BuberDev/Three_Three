import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
import { Task } from '@/lib/types';
import React from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (task: Omit<Task, 'id'>) => void;
}

function getPriorityConfig(priority: 'low' | 'medium' | 'high') {
    switch (priority) {
        case 'high':
            return {
                label: 'Wysokiy',
                color: '#EF4444',
                icon: 'exclamationmark.triangle.fill' as const,
            };
        case 'medium':
            return {
                label: 'Średni',
                color: '#F59E0B',
                icon: 'minus.circle.fill' as const,
            };
        case 'low':
            return {
                label: 'Niski',
                color: '#10B981',
                icon: 'checkmark.circle.fill' as const,
            };
    }
}

export function AddTaskModal({ visible, onClose, onSave }: AddTaskModalProps) {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = React.useState<string>('');
    const [category, setCategory] = React.useState<string>('general');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setCategory('general');
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Błąd', 'Tytuł zadania jest wymagany');
            return;
        }

        try {
            const task: Omit<Task, 'id'> = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                completed: false,
                dueDate: dueDate || undefined,
                category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (onSave) {
                onSave(task);
            }

            Alert.alert(
                'Zadanie dodane!',
                'Twoje zadanie zostało pomyślnie utworzone.',
                [{ text: 'OK', onPress: () => { } }]
            );

            resetForm();
            onClose();
        } catch (error) {
            console.error('Failed to add task:', error);
            Alert.alert('Błąd', 'Nie udało się dodać zadania');
        }
    };

    const getFormattedDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => {
                resetForm();
                onClose();
            }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[
                    styles.modalOverlay,
                    {
                        paddingTop: insets.top + DesignSystem.spacing.lg,
                        paddingBottom: insets.bottom + DesignSystem.spacing.lg,
                    },
                ]}
            >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Dodaj nowe zadanie</ThemedText>
                    <TouchableOpacity
                        onPress={() => {
                            resetForm();
                            onClose();
                        }}
                    >
                        <IconSymbol name="xmark" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.formContainer}
                    contentContainerStyle={styles.formContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
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
                                autoFocus
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

                    {/* Category Selection */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Kategoria</ThemedText>
                        <View style={styles.categoryContainer}>
                            {['general', 'work', 'personal', 'health', 'routine'].map((cat) => {
                                const isSelected = category === cat;
                                const categoryLabels = {
                                    general: 'Ogólne',
                                    work: 'Praca',
                                    personal: 'Osobiste',
                                    health: 'Zdrowie',
                                    routine: 'Rutyna'
                                };

                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryButton,
                                            isSelected && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.categoryText,
                                                isSelected && styles.categoryTextActive,
                                            ]}
                                        >
                                            {categoryLabels[cat as keyof typeof categoryLabels]}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Priority Selection */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Priorytet</ThemedText>
                        <View style={styles.priorityContainer}>
                            {(['low', 'medium', 'high'] as const).map((p) => {
                                const priorityConfig = getPriorityConfig(p);
                                const isSelected = priority === p;
                                const backgroundColor = isSelected
                                    ? priorityConfig.color + '20'
                                    : Colors.light.background;

                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityButton,
                                            isSelected && styles.priorityButtonActive,
                                            { backgroundColor },
                                        ]}
                                        onPress={() => setPriority(p)}
                                    >
                                        <IconSymbol
                                            size={16}
                                            name={priorityConfig.icon}
                                            color={priorityConfig.color}
                                        />
                                        <ThemedText
                                            style={[
                                                styles.priorityText,
                                                {
                                                    color: isSelected
                                                        ? Colors.light.text
                                                        : Colors.light.textSecondary,
                                                },
                                            ]}
                                        >
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
                                placeholder={`Dziś: ${getFormattedDate()}`}
                                placeholderTextColor={Colors.light.textSecondary}
                            />
                            <TouchableOpacity
                                style={styles.todayButton}
                                onPress={() => setDueDate(getFormattedDate())}
                            >
                                <ThemedText style={styles.todayButtonText}>Dziś</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => {
                            resetForm();
                            onClose();
                        }}
                    >
                        <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSave}
                    >
                        <IconSymbol name="plus" size={16} color="white" />
                        <ThemedText style={styles.saveButtonText}>Dodaj zadanie</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        paddingHorizontal: DesignSystem.spacing.lg,
    },
    modalContent: {
        backgroundColor: Colors.light.background,
        borderRadius: DesignSystem.borderRadius['2xl'],
        maxHeight: '100%',
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        ...DesignSystem.elevation[4],
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: DesignSystem.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    formContainer: {
        flexGrow: 0,
    },
    formContent: {
        padding: DesignSystem.spacing.lg,
    },
    inputGroup: {
        marginBottom: DesignSystem.spacing.xl,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: DesignSystem.spacing.md,
    },
    inputContainer: {
        position: 'relative',
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: DesignSystem.borderRadius.lg,
        padding: DesignSystem.spacing.md,
        fontSize: 16,
        color: Colors.light.text,
        backgroundColor: Colors.light.background,
        minHeight: 48,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    todayButton: {
        position: 'absolute',
        right: DesignSystem.spacing.sm,
        top: DesignSystem.spacing.sm,
        backgroundColor: Colors.light.primary,
        paddingHorizontal: DesignSystem.spacing.sm,
        paddingVertical: DesignSystem.spacing.xs,
        borderRadius: DesignSystem.borderRadius.md,
    },
    todayButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: DesignSystem.spacing.sm,
    },
    categoryButton: {
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.background,
    },
    categoryButtonActive: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    categoryText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    categoryTextActive: {
        color: 'white',
        fontWeight: '500',
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.sm,
    },
    priorityButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.light.border,
        gap: DesignSystem.spacing.xs,
    },
    priorityButtonActive: {
        borderWidth: 2,
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        padding: DesignSystem.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        gap: DesignSystem.spacing.md,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DesignSystem.spacing.md,
        paddingHorizontal: DesignSystem.spacing.lg,
        borderRadius: DesignSystem.borderRadius.lg,
        minHeight: 48,
        gap: DesignSystem.spacing.xs,
    },
    cancelButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    cancelButtonText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: Colors.light.primary,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
