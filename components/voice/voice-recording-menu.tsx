import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors as ColorsTheme } from '../../constants/theme';
import { useAppStore } from '../../stores/app-store';
import { IconSymbol } from '../ui/icon-symbol';
import { VoiceRecorder } from './voice-recorder';

// Create type-safe color access
const Colors = ColorsTheme as any;

interface VoiceRecordingMenuProps {
    visible: boolean;
    onClose: () => void;
}

type RecordingCategory =
    | { type: 'daily', subtype: 'morning' | 'evening' | 'summary' }
    | { type: 'sleep', subtype: 'dream' | 'insomnia' | 'morning-reflection' | 'sleep-quality' }
    | { type: 'life', subtype: 'reflection' | 'gratitude' | 'emotion' | 'achievement' | 'challenge' }
    | { type: 'general' };

export const VoiceRecordingMenu: React.FC<VoiceRecordingMenuProps> = ({
    visible,
    onClose,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<RecordingCategory | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const {
        uploadDailyReportVoice,
        uploadSleepReportVoice,
        uploadLifeExperienceVoice,
        uploadVoiceNote,
        isProcessingVoiceNote,
    } = useAppStore();

    const handleRecordingComplete = async (audioUri: string) => {
        if (!selectedCategory) return false;

        try {
            let success = false;

            switch (selectedCategory.type) {
                case 'daily':
                    success = await uploadDailyReportVoice(audioUri, selectedCategory.subtype);
                    break;
                case 'sleep':
                    success = await uploadSleepReportVoice(audioUri, selectedCategory.subtype);
                    break;
                case 'life':
                    success = await uploadLifeExperienceVoice(audioUri, selectedCategory.subtype);
                    break;
                case 'general':
                    success = await uploadVoiceNote(audioUri);
                    break;
            }

            if (success) {
                onClose();
                setSelectedCategory(null);
            }

            return success;
        } catch (error) {
            console.error('🚨 Recording upload failed:', error);
            return false;
        }
    };

    const renderCategorySelector = () => (
        <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Wybierz typ nagrania</Text>

            {/* Daily Reports */}
            <View style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>Dzienne raporty</Text>
                {[
                    { key: 'morning', label: 'Poranny raport', icon: 'sun.max' },
                    { key: 'evening', label: 'Wieczorny raport', icon: 'moon' },
                    { key: 'summary', label: 'Podsumowanie dnia', icon: 'doc.text' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.categoryItem}
                        onPress={() => setSelectedCategory({ type: 'daily', subtype: item.key as any })}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
                            <IconSymbol name={item.icon} size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.categoryLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Sleep Reports */}
            <View style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>Sen i relaks</Text>
                {[
                    { key: 'dream', label: 'Opis snu', icon: 'cloud' },
                    { key: 'insomnia', label: 'Problemy ze snem', icon: 'moon.zzz' },
                    { key: 'morning-reflection', label: 'Poranna refleksja', icon: 'sunrise' },
                    { key: 'sleep-quality', label: 'Jakość snu', icon: 'star' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.categoryItem}
                        onPress={() => setSelectedCategory({ type: 'sleep', subtype: item.key as any })}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
                            <IconSymbol name={item.icon} size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.categoryLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Life Experiences */}
            <View style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>Życie i emocje</Text>
                {[
                    { key: 'reflection', label: 'Refleksje', icon: 'lightbulb' },
                    { key: 'gratitude', label: 'Wdzięczność', icon: 'heart' },
                    { key: 'emotion', label: 'Emocje', icon: 'face.smiling' },
                    { key: 'achievement', label: 'Osiągnięcia', icon: 'trophy' },
                    { key: 'challenge', label: 'Wyzwania', icon: 'target' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.categoryItem}
                        onPress={() => setSelectedCategory({ type: 'life', subtype: item.key as any })}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
                            <IconSymbol name={item.icon} size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.categoryLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* General Recording */}
            <View style={styles.categoryGroup}>
                <TouchableOpacity
                    style={[styles.categoryItem, styles.generalCategory]}
                    onPress={() => setSelectedCategory({ type: 'general' })}
                >
                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
                        <IconSymbol name="mic" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.categoryLabel}>Ogólne nagranie</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderRecordingInterface = () => {
        const getCategoryDisplay = () => {
            if (!selectedCategory) return '';

            switch (selectedCategory.type) {
                case 'daily':
                    const dailyLabels = {
                        morning: 'Poranny raport',
                        evening: 'Wieczorny raport',
                        summary: 'Podsumowanie dnia',
                    };
                    return dailyLabels[selectedCategory.subtype];
                case 'sleep':
                    const sleepLabels = {
                        dream: 'Opis snu',
                        insomnia: 'Problemy ze snem',
                        'morning-reflection': 'Poranna refleksja',
                        'sleep-quality': 'Jakość snu',
                    };
                    return sleepLabels[selectedCategory.subtype];
                case 'life':
                    const lifeLabels = {
                        reflection: 'Refleksje',
                        gratitude: 'Wdzięczność',
                        emotion: 'Emocje',
                        achievement: 'Osiągnięcia',
                        challenge: 'Wyzwania',
                    };
                    return lifeLabels[selectedCategory.subtype];
                case 'general':
                    return 'Ogólne nagranie';
            }
        };

        return (
            <View style={styles.recordingContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedCategory(null)}
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                    <Text style={styles.backText}>Wróć</Text>
                </TouchableOpacity>

                <Text style={styles.recordingTitle}>{getCategoryDisplay()}</Text>

                <VoiceRecorder
                    size="large"
                    onCompleteWithAudio={handleRecordingComplete}
                    disabled={isProcessingVoiceNote}
                />

                {isProcessingVoiceNote && (
                    <Text style={styles.processingText}>
                        Przetwarzanie nagrania...
                    </Text>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {selectedCategory ? renderRecordingInterface() : renderCategorySelector()}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    closeButton: {
        padding: 8,
    },
    categoriesContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 30,
    },
    categoryGroup: {
        marginBottom: 30,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 15,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    generalCategory: {
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    categoryLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    recordingContainer: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 5,
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
    },
    recordingTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 40,
    },
    processingText: {
        marginTop: 20,
        fontSize: 16,
        color: Colors.gray,
        textAlign: 'center',
    },
});