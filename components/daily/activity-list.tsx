import { Colors } from '@/constants/theme';
import { Activity, ActivityCategory, EnergyLevel, MoodType, TimeOfDay } from '@/lib/types';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface ActivityListProps {
    activities: Activity[];
    showCompleted?: boolean;
    emptyMessage?: string;
    onActivityPress?: (activity: Activity) => void;
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

const timeLabels: Record<TimeOfDay, string> = {
    [TimeOfDay.EARLY_MORNING]: 'Wczesny ranek',
    [TimeOfDay.MORNING]: 'Rano',
    [TimeOfDay.AFTERNOON]: 'Popołudnie',
    [TimeOfDay.EVENING]: 'Wieczór',
    [TimeOfDay.NIGHT]: 'Noc'
};

export function ActivityList({
    activities,
    showCompleted = true,
    emptyMessage = "Brak aktywności",
    onActivityPress
}: ActivityListProps) {
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return null;
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    };

    const getMoodIcon = (mood?: MoodType) => {
        if (!mood) return null;
        const moodIcons = ['😢', '😞', '😐', '😊', '😄'];
        return moodIcons[mood - 1];
    };

    const getEnergyColor = (energy?: EnergyLevel) => {
        if (!energy) return '#ccc';
        const colors = ['#ff4757', '#ff6b35', '#ffa502', '#2ed573', '#1dd1a1'];
        return colors[energy - 1];
    };

    const renderActivity = ({ item }: { item: Activity }) => (
        <TouchableOpacity
            style={styles.activityItem}
            onPress={() => onActivityPress?.(item)}
            activeOpacity={0.7}
        >
            <View style={styles.activityHeader}>
                <View style={styles.activityTitleRow}>
                    <IconSymbol
                        name={categoryIcons[item.category] as any}
                        size={20}
                        color={Colors.light.tint}
                    />
                    <View style={styles.activityTitleContainer}>
                        <ThemedText style={styles.activityTitle}>
                            {item.title}
                        </ThemedText>
                        <View style={styles.activityMeta}>
                            <ThemedText style={styles.activityCategory}>
                                {categoryLabels[item.category]}
                            </ThemedText>
                            <ThemedText style={styles.activityTime}>
                                {formatTime(item.createdAt)}
                            </ThemedText>
                            {timeLabels[item.timeOfDay] && (
                                <ThemedText style={styles.activityTimeOfDay}>
                                    {timeLabels[item.timeOfDay]}
                                </ThemedText>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.activityIndicators}>
                    {item.mood && (
                        <View style={styles.moodIndicator}>
                            <ThemedText style={styles.moodEmoji}>
                                {getMoodIcon(item.mood)}
                            </ThemedText>
                        </View>
                    )}
                    {item.energyLevel && (
                        <View style={[
                            styles.energyIndicator,
                            { backgroundColor: getEnergyColor(item.energyLevel) }
                        ]}>
                            <ThemedText style={styles.energyText}>
                                {item.energyLevel}
                            </ThemedText>
                        </View>
                    )}
                </View>
            </View>

            {item.description && (
                <ThemedText style={styles.activityDescription}>
                    {item.description}
                </ThemedText>
            )}

            <View style={styles.activityFooter}>
                {item.duration && (
                    <View style={styles.durationContainer}>
                        <IconSymbol name="clock" size={14} color="#666" />
                        <ThemedText style={styles.durationText}>
                            {formatDuration(item.duration)}
                        </ThemedText>
                    </View>
                )}

                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <ThemedText style={styles.tagText}>
                                    {tag}
                                </ThemedText>
                            </View>
                        ))}
                        {item.tags.length > 3 && (
                            <ThemedText style={styles.moreTagsText}>
                                +{item.tags.length - 3}
                            </ThemedText>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    if (activities.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <IconSymbol name="clock" size={32} color="#ccc" />
                <ThemedText style={styles.emptyText}>
                    {emptyMessage}
                </ThemedText>
            </View>
        );
    }

    return (
        <FlatList
            data={activities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.list}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
    activityItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    activityTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
    },
    activityTitleContainer: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        lineHeight: 22,
    },
    activityMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    activityCategory: {
        fontSize: 12,
        color: Colors.light.tint,
        fontWeight: '500',
    },
    activityTime: {
        fontSize: 12,
        color: '#666',
    },
    activityTimeOfDay: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    activityIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    moodIndicator: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f8f8f8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moodEmoji: {
        fontSize: 16,
    },
    energyIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    energyText: {
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
    },
    activityDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    activityFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        fontSize: 12,
        color: '#666',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        justifyContent: 'flex-end',
    },
    tag: {
        backgroundColor: Colors.light.tint + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 10,
        color: Colors.light.tint,
        fontWeight: '500',
    },
    moreTagsText: {
        fontSize: 10,
        color: '#666',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 32,
        gap: 8,
    },
    emptyText: {
        opacity: 0.6,
        textAlign: 'center',
    },
});