import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
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

interface PlanningModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (planningData: PlanningData) => void;
}

interface PlanningData {
    mainGoal: string;
    priorities: string[];
    timeBlocks: TimeBlock[];
    notes: string;
}

interface TimeBlock {
    time: string;
    activity: string;
    duration: string;
}

export function PlanningModal({ visible, onClose, onSave }: PlanningModalProps) {
    const insets = useSafeAreaInsets();
    const [mainGoal, setMainGoal] = React.useState('');
    const [priority1, setPriority1] = React.useState('');
    const [priority2, setPriority2] = React.useState('');
    const [priority3, setPriority3] = React.useState('');
    const [morningActivity, setMorningActivity] = React.useState('');
    const [afternoonActivity, setAfternoonActivity] = React.useState('');
    const [eveningActivity, setEveningActivity] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [selectedTemplate, setSelectedTemplate] = React.useState<'work' | 'personal' | 'custom'>('custom');

    const resetForm = () => {
        setMainGoal('');
        setPriority1('');
        setPriority2('');
        setPriority3('');
        setMorningActivity('');
        setAfternoonActivity('');
        setEveningActivity('');
        setNotes('');
        setSelectedTemplate('custom');
    };

    const applyTemplate = (template: 'work' | 'personal' | 'custom') => {
        setSelectedTemplate(template);

        switch (template) {
            case 'work':
                setMainGoal('Produktywny dzień w pracy');
                setPriority1('Ukończenie najważniejszego projektu');
                setPriority2('Odpowiedź na e-maile');
                setPriority3('Planowanie na jutro');
                setMorningActivity('Przegląd priorytetów na dziś');
                setAfternoonActivity('Realizacja głównych zadań');
                setEveningActivity('Podsumowanie dnia');
                break;
            case 'personal':
                setMainGoal('Rozwój osobisty i wellbeing');
                setPriority1('Ćwiczenia fizyczne');
                setPriority2('Czas dla rodziny/przyjaciół');
                setPriority3('Hobby lub nauka');
                setMorningActivity('Poranna rutyna i ćwiczenia');
                setAfternoonActivity('Czas na rozwój i relacje');
                setEveningActivity('Relaks i refleksja');
                break;
            default:
                resetForm();
                setSelectedTemplate('custom');
                break;
        }
    };

    const handleSave = () => {
        if (!mainGoal.trim()) {
            Alert.alert('Błąd', 'Wprowadź główny cel dnia');
            return;
        }

        const planningData: PlanningData = {
            mainGoal: mainGoal.trim(),
            priorities: [priority1, priority2, priority3].filter(p => p.trim()),
            timeBlocks: [
                { time: 'Rano (6-12)', activity: morningActivity, duration: '6h' },
                { time: 'Popołudnie (12-18)', activity: afternoonActivity, duration: '6h' },
                { time: 'Wieczór (18-22)', activity: eveningActivity, duration: '4h' },
            ].filter(block => block.activity.trim()),
            notes: notes.trim(),
        };

        if (onSave) {
            onSave(planningData);
        }

        Alert.alert(
            'Plan zapisany!',
            'Twój plan na dziś został utworzony. Możesz go śledzić przez notki głosowe.',
            [{ text: 'OK', onPress: () => { } }]
        );

        resetForm();
        onClose();
    };

    const getCurrentDate = () => {
        const today = new Date();
        return today.toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
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
                    <View>
                        <ThemedText style={styles.modalTitle}>Planowanie dnia</ThemedText>
                        <ThemedText style={styles.modalSubtitle}>{getCurrentDate()}</ThemedText>
                    </View>
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
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Szablony planowania</ThemedText>
                        <View style={styles.templateContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.templateButton,
                                    selectedTemplate === 'work' && styles.templateButtonActive,
                                ]}
                                onPress={() => applyTemplate('work')}
                            >
                                <IconSymbol name="briefcase.fill" size={16} color={selectedTemplate === 'work' ? 'white' : Colors.light.primary} />
                                <ThemedText style={[styles.templateText, selectedTemplate === 'work' && styles.templateTextActive]}>Praca</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.templateButton,
                                    selectedTemplate === 'personal' && styles.templateButtonActive,
                                ]}
                                onPress={() => applyTemplate('personal')}
                            >
                                <IconSymbol name="heart.fill" size={16} color={selectedTemplate === 'personal' ? 'white' : Colors.light.primary} />
                                <ThemedText style={[styles.templateText, selectedTemplate === 'personal' && styles.templateTextActive]}>Osobiste</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.templateButton,
                                    selectedTemplate === 'custom' && styles.templateButtonActive,
                                ]}
                                onPress={() => applyTemplate('custom')}
                            >
                                <IconSymbol name="pencil" size={16} color={selectedTemplate === 'custom' ? 'white' : Colors.light.primary} />
                                <ThemedText style={[styles.templateText, selectedTemplate === 'custom' && styles.templateTextActive]}>Własny</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Główny cel dnia *</ThemedText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                value={mainGoal}
                                onChangeText={setMainGoal}
                                placeholder="Co chcesz osiągnąć dzisiaj?"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={100}
                                autoFocus
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Trzy najważniejsze rzeczy</ThemedText>

                        <View style={styles.priorityInputContainer}>
                            <View style={styles.priorityNumber}>
                                <ThemedText style={styles.priorityNumberText}>1</ThemedText>
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.priorityInput]}
                                value={priority1}
                                onChangeText={setPriority1}
                                placeholder="Najważniejsza rzecz"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={80}
                            />
                        </View>

                        <View style={styles.priorityInputContainer}>
                            <View style={styles.priorityNumber}>
                                <ThemedText style={styles.priorityNumberText}>2</ThemedText>
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.priorityInput]}
                                value={priority2}
                                onChangeText={setPriority2}
                                placeholder="Druga rzecz"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={80}
                            />
                        </View>

                        <View style={styles.priorityInputContainer}>
                            <View style={styles.priorityNumber}>
                                <ThemedText style={styles.priorityNumberText}>3</ThemedText>
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.priorityInput]}
                                value={priority3}
                                onChangeText={setPriority3}
                                placeholder="Trzecia rzecz"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={80}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Plan na poszczególne części dnia</ThemedText>

                        <View style={styles.timeBlockContainer}>
                            <View style={styles.timeBlockHeader}>
                                <IconSymbol name="sun.max.fill" size={16} color="#F59E0B" />
                                <ThemedText style={styles.timeBlockTitle}>Rano (6-12)</ThemedText>
                            </View>
                            <TextInput
                                style={styles.textInput}
                                value={morningActivity}
                                onChangeText={setMorningActivity}
                                placeholder="Co będziesz robić rano?"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={100}
                            />
                        </View>

                        <View style={styles.timeBlockContainer}>
                            <View style={styles.timeBlockHeader}>
                                <IconSymbol name="sun.haze.fill" size={16} color="#EF4444" />
                                <ThemedText style={styles.timeBlockTitle}>Popołudnie (12-18)</ThemedText>
                            </View>
                            <TextInput
                                style={styles.textInput}
                                value={afternoonActivity}
                                onChangeText={setAfternoonActivity}
                                placeholder="Co będziesz robić po południu?"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={100}
                            />
                        </View>

                        <View style={styles.timeBlockContainer}>
                            <View style={styles.timeBlockHeader}>
                                <IconSymbol name="moon.fill" size={16} color="#6366F1" />
                                <ThemedText style={styles.timeBlockTitle}>Wieczór (18-22)</ThemedText>
                            </View>
                            <TextInput
                                style={styles.textInput}
                                value={eveningActivity}
                                onChangeText={setEveningActivity}
                                placeholder="Co będziesz robić wieczorem?"
                                placeholderTextColor={Colors.light.textSecondary}
                                maxLength={100}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Dodatkowe notatki</ThemedText>
                        <TextInput
                            style={[styles.textInput, styles.multilineInput]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Inne rzeczy do zapamiętania..."
                            placeholderTextColor={Colors.light.textSecondary}
                            multiline
                            numberOfLines={3}
                            maxLength={300}
                        />
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
                        <IconSymbol name="checkmark" size={16} color="white" />
                        <ThemedText style={styles.saveButtonText}>Zapisz plan</ThemedText>
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
        alignItems: 'flex-start',
        padding: DesignSystem.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginTop: DesignSystem.spacing.xs,
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
    templateContainer: {
        flexDirection: 'row',
        gap: DesignSystem.spacing.sm,
    },
    templateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.light.primary,
        backgroundColor: Colors.light.background,
        gap: DesignSystem.spacing.xs,
    },
    templateButtonActive: {
        backgroundColor: Colors.light.primary,
    },
    templateText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.primary,
    },
    templateTextActive: {
        color: 'white',
    },
    priorityInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.md,
        marginBottom: DesignSystem.spacing.md,
    },
    priorityNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priorityNumberText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    priorityInput: {
        flex: 1,
    },
    timeBlockContainer: {
        marginBottom: DesignSystem.spacing.md,
    },
    timeBlockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
        marginBottom: DesignSystem.spacing.sm,
    },
    timeBlockTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
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
