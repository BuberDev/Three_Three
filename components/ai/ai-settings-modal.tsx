import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors, DesignSystem } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface AISettingsModalProps {
    visible: boolean;
    onClose: () => void;
    systemInstruction: string;
    onSystemInstructionChange: (instruction: string) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
    visible,
    onClose,
    systemInstruction,
    onSystemInstructionChange,
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [tempInstruction, setTempInstruction] = useState(systemInstruction);

    const handleSave = () => {
        onSystemInstructionChange(tempInstruction);
        onClose();
    };

    const resetToDefault = () => {
        const defaultInstruction = `Jesteś pomocnym AI asystentem. Odpowiadaj w języku polskim, chyba że użytkownik poprosi o inny język.

Zasady:
- Bądź precyzyjny i pomocny
- Gdy nie wiesz, powiedz to wprost
- Udzielaj praktycznych rad
- Formatuj kod w blokach markdown
- Używaj emoji oszczędnie i tylko gdy dodają wartość

Twoja rola to pomoc użytkownikowi w rozwiązywaniu problemów i udzielaniu informacji.`;
        setTempInstruction(defaultInstruction);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Ustawienia AI
                    </Text>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={[styles.saveText, { color: colors.primary }]}>
                            Zapisz
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* System Instruction */}
                    <View style={styles.section}>
                        <View style={styles.instructionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Instrukcja systemowa
                            </Text>
                            <TouchableOpacity
                                style={[styles.resetButton, { borderColor: colors.border }]}
                                onPress={resetToDefault}
                            >
                                <Ionicons name="refresh" size={14} color={colors.textSecondary} />
                                <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                                    Reset
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                            Określ jak AI ma się zachowywać i odpowiadać
                        </Text>

                        <TextInput
                            style={[
                                styles.instructionInput,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                }
                            ]}
                            placeholder="Wprowadź instrukcję dla AI asystenta..."
                            placeholderTextColor={colors.textSecondary}
                            value={tempInstruction}
                            onChangeText={setTempInstruction}
                            multiline
                            numberOfLines={10}
                            textAlignVertical="top"
                        />

                        <View style={styles.instructionTips}>
                            <Text style={[styles.tipsTitle, { color: colors.text }]}>
                                💡 Wskazówki:
                            </Text>
                            <Text style={[styles.tip, { color: colors.textSecondary }]}>
                                • Określ język odpowiedzi i styl komunikacji
                            </Text>
                            <Text style={[styles.tip, { color: colors.textSecondary }]}>
                                • Dodaj specjalne zasady dla swojej dziedziny
                            </Text>
                            <Text style={[styles.tip, { color: colors.textSecondary }]}>
                                • Wyjaśnij jak AI ma formatować kod i przykłady
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.lg,
        paddingVertical: DesignSystem.spacing.md,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: DesignSystem.spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    saveButton: {
        padding: DesignSystem.spacing.sm,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: DesignSystem.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: DesignSystem.spacing.xs,
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: DesignSystem.spacing.lg,
    },
    modelCard: {
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.lg,
        padding: DesignSystem.spacing.lg,
        marginBottom: DesignSystem.spacing.md,
    },
    modelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: DesignSystem.spacing.sm,
    },
    modelInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: DesignSystem.spacing.sm,
    },
    providerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modelDetails: {
        flex: 1,
    },
    modelName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    modelProvider: {
        fontSize: 12,
        opacity: 0.8,
    },
    modelDescription: {
        fontSize: 14,
        lineHeight: 18,
        marginBottom: DesignSystem.spacing.sm,
    },
    modelPricing: {
        paddingTop: DesignSystem.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    pricingText: {
        fontSize: 11,
        opacity: 0.6,
    },
    instructionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignSystem.spacing.xs,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.xs,
        paddingHorizontal: DesignSystem.spacing.sm,
        paddingVertical: DesignSystem.spacing.xs,
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.sm,
    },
    resetText: {
        fontSize: 12,
        fontWeight: '500',
    },
    instructionInput: {
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.lg,
        padding: DesignSystem.spacing.md,
        fontSize: 14,
        lineHeight: 20,
        minHeight: 120,
        marginBottom: DesignSystem.spacing.lg,
    },
    instructionTips: {
        gap: DesignSystem.spacing.xs,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: DesignSystem.spacing.xs,
    },
    tip: {
        fontSize: 13,
        lineHeight: 18,
    },
});