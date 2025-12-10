import { Colors } from '@/constants/theme';
import { ActivityCategory, EnergyLevel, MoodType, TimeOfDay } from '@/lib/types';
import { useAppStore } from '@/stores/app-store';
import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface QuickActivityModalProps {
    visible: boolean;
    onClose: () => void;
}

const categoryIcons: Record<ActivityCategory, string> = {
    [ActivityCategory.WORK]: 'briefcase',
    [ActivityCategory.HEALTH]: 'heart',
    [ActivityCategory.LEARNING]: 'book',
    [ActivityCategory.SOCIAL]: 'person.2',
    [ActivityCategory.PERSONAL]: 'person.crop.circle',
    [ActivityCategory.EXERCISE]: 'figure.run',
    [ActivityCategory.NUTRITION]: 'fork.knife',
    [ActivityCategory.SLEEP]: 'moon',
    [ActivityCategory.ENTERTAINMENT]: 'tv',
    [ActivityCategory.TRAVEL]: 'car',
    [ActivityCategory.HOUSEHOLD]: 'house',
    [ActivityCategory.FINANCE]: 'dollarsign.circle',
    [ActivityCategory.OTHER]: 'ellipsis.circle'
};

const categoryLabels: Record<ActivityCategory, string> = {
    [ActivityCategory.WORK]: 'Praca',
    [ActivityCategory.HEALTH]: 'Zdrowie',
    [ActivityCategory.LEARNING]: 'Nauka',
    [ActivityCategory.SOCIAL]: 'Społeczne',
    [ActivityCategory.PERSONAL]: 'Osobiste',
    [ActivityCategory.EXERCISE]: 'Ćwiczenia',
    [ActivityCategory.NUTRITION]: 'Żywienie',
    [ActivityCategory.SLEEP]: 'Sen',
    [ActivityCategory.ENTERTAINMENT]: 'Rozrywka',
    [ActivityCategory.TRAVEL]: 'Podróże',
    [ActivityCategory.HOUSEHOLD]: 'Dom',
    [ActivityCategory.FINANCE]: 'Finanse',
    [ActivityCategory.OTHER]: 'Inne'
};

export function QuickActivityModal({ visible, onClose }: QuickActivityModalProps) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<ActivityCategory>(ActivityCategory.WORK);
    const [energyLevel, setEnergyLevel] = React.useState<EnergyLevel>(EnergyLevel.MEDIUM);
    const [mood, setMood] = React.useState<MoodType>(MoodType.NEUTRAL);
    const [duration, setDuration] = React.useState('');
    const [tags, setTags] = React.useState('');

    const { addActivity, user } = useAppStore();

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedCategory(ActivityCategory.WORK);
        setEnergyLevel(EnergyLevel.MEDIUM);
        setMood(MoodType.NEUTRAL);
        setDuration('');
        setTags('');
    };

    const getCurrentTimeOfDay = (): TimeOfDay => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 8) return TimeOfDay.EARLY_MORNING;
        if (hour >= 8 && hour < 12) return TimeOfDay.MORNING;
        if (hour >= 12 && hour < 17) return TimeOfDay.AFTERNOON;
        if (hour >= 17 && hour < 21) return TimeOfDay.EVENING;
        return TimeOfDay.NIGHT;
    };

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Błąd', 'Nazwa aktywności jest wymagana');
            return;
        }

        if (!user) {
            Alert.alert('Błąd', 'Musisz być zalogowany');
            return;
        }

        const activity = {
            id: Date.now().toString(),
            userId: user.id,
            title: title.trim(),
            description: description.trim() || undefined,
            category: selectedCategory,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
            duration: duration ? parseInt(duration) : undefined,
            timeOfDay: getCurrentTimeOfDay(),
            energyLevel,
            mood,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addActivity(activity);
        resetForm();
        onClose();

        Alert.alert('Sukces', 'Aktywność została dodana!');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <IconSymbol name="xmark" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.title}>
                        Dodaj aktywność
                    </ThemedText>
                    <TouchableOpacity onPress={handleSave}>
                        <ThemedText style={styles.saveButton}>Zapisz</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Nazwa aktywności *</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="np. Spotkanie z klientem, Bieganie, Czytanie..."
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Opis (opcjonalny)</ThemedText>
                        <TextInput
                            style={[styles.textInput, styles.multilineInput]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Dodatkowe informacje o aktywności..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Kategoria</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.categoriesRow}>
                                {Object.values(ActivityCategory).map((category) => (
                                    <TouchableOpacity
                                        key={category}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory === category && styles.categoryButtonSelected
                                        ]}
                                        onPress={() => setSelectedCategory(category)}
                                    >
                                        <IconSymbol
                                            name={categoryIcons[category] as any}
                                            size={20}
                                            color={selectedCategory === category ? 'white' : Colors.light.tint}
                                        />
                                        <ThemedText style={[
                                            styles.categoryLabel,
                                            selectedCategory === category && styles.categoryLabelSelected
                                        ]}>
                                            {categoryLabels[category]}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Czas trwania (minuty)</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="np. 30"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Poziom energii</ThemedText>
                        <View style={styles.scaleContainer}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.scaleButton,
                                        energyLevel === level && styles.scaleButtonSelected
                                    ]}
                                    onPress={() => setEnergyLevel(level as EnergyLevel)}
                                >
                                    <ThemedText style={[
                                        styles.scaleText,
                                        energyLevel === level && styles.scaleTextSelected
                                    ]}>
                                        {level}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Nastrój</ThemedText>
                        <View style={styles.scaleContainer}>
                            {[1, 2, 3, 4, 5].map((moodLevel) => (
                                <TouchableOpacity
                                    key={moodLevel}
                                    style={[
                                        styles.scaleButton,
                                        mood === moodLevel && styles.scaleButtonSelected
                                    ]}
                                    onPress={() => setMood(moodLevel as MoodType)}
                                >
                                    <ThemedText style={[
                                        styles.scaleText,
                                        mood === moodLevel && styles.scaleTextSelected
                                    ]}>
                                        {['😢', '😞', '😐', '😊', '😄'][moodLevel - 1]}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Tagi (oddzielone przecinkami)</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            value={tags}
                            onChangeText={setTags}
                            placeholder="np. pilne, ważne, zespołowe"
                            placeholderTextColor="#999"
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
    },
    saveButton: {
        color: Colors.light.tint,
        fontWeight: 'bold',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: Colors.light.text,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: 'white',
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 8,
    },
    categoryButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.light.tint + '30',
        minWidth: 80,
    },
    categoryButtonSelected: {
        backgroundColor: Colors.light.tint,
        borderColor: Colors.light.tint,
    },
    categoryLabel: {
        fontSize: 12,
        marginTop: 4,
        color: Colors.light.tint,
    },
    categoryLabelSelected: {
        color: 'white',
    },
    scaleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
    },
    scaleButton: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    scaleButtonSelected: {
        backgroundColor: Colors.light.tint,
    },
    scaleText: {
        fontSize: 18,
        color: Colors.light.text,
    },
    scaleTextSelected: {
        color: 'white',
    },
});