import React from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { Habit, HabitCategory, HabitFrequency } from '@/lib/types';

interface HabitDetailsModalProps {
    habit: Habit | null;
    visible: boolean;
    onClose: () => void;
    onEdit?: (habit: Habit) => void;
    onDelete?: (habitId: string) => void;
}

interface StreakCalendarProps {
    habit: Habit;
    completionDates: string[]; // Array of completion dates
}

const { width: screenWidth } = Dimensions.get('window');

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

function StreakCalendar({ habit, completionDates }: StreakCalendarProps) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 3 months ago
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Next month

    const generateCalendarDays = () => {
        const days = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const calendarDays = generateCalendarDays();
    const completionSet = new Set(completionDates.map(date => new Date(date).toDateString()));

    const getActivityLevel = (date: Date): 'none' | 'low' | 'medium' | 'high' => {
        const dateString = date.toDateString();
        if (completionSet.has(dateString)) {
            return 'high';
        }
        return 'none';
    };

    const getActivityColor = (level: 'none' | 'low' | 'medium' | 'high'): string => {
        switch (level) {
            case 'high': return categoryConfig[habit.category].color;
            case 'medium': return categoryConfig[habit.category].color + '80';
            case 'low': return categoryConfig[habit.category].color + '40';
            default: return '#f0f0f0';
        }
    };

    return (
        <View style={styles.calendarContainer}>
            <ThemedText style={styles.calendarTitle}>Kalendarz aktywności (ostatnie 3 miesiące)</ThemedText>
            <View style={styles.calendarGrid}>
                {calendarDays.map(day => {
                    const isToday = day.toDateString() === today.toDateString();
                    const activityLevel = getActivityLevel(day);

                    return (
                        <View
                            key={day.toISOString()}
                            style={[
                                styles.calendarDay,
                                {
                                    backgroundColor: getActivityColor(activityLevel),
                                    borderColor: isToday ? Colors.light.tint : 'transparent',
                                    borderWidth: isToday ? 2 : 0,
                                }
                            ]}
                        />
                    );
                })}
            </View>
            <View style={styles.calendarLegend}>
                <ThemedText style={styles.legendText}>Mniej</ThemedText>
                <View style={styles.legendDots}>
                    <View style={[styles.legendDot, { backgroundColor: '#f0f0f0' }]} />
                    <View style={[styles.legendDot, { backgroundColor: categoryConfig[habit.category].color + '40' }]} />
                    <View style={[styles.legendDot, { backgroundColor: categoryConfig[habit.category].color + '80' }]} />
                    <View style={[styles.legendDot, { backgroundColor: categoryConfig[habit.category].color }]} />
                </View>
                <ThemedText style={styles.legendText}>Więcej</ThemedText>
            </View>
        </View>
    );
}

export function HabitDetailsModal({ habit, visible, onClose, onEdit, onDelete }: HabitDetailsModalProps) {
    const [completionDates, setCompletionDates] = React.useState<string[]>([]);

    // Mock completion dates for demonstration - in real app, fetch from API
    React.useEffect(() => {
        if (habit) {
            // Generate some mock completion dates based on current streak
            const dates = [];
            const today = new Date();
            for (let i = 0; i < habit.currentStreak && i < 90; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dates.push(date.toISOString().split('T')[0]);
            }
            setCompletionDates(dates);
        }
    }, [habit]);

    const handleDelete = () => {
        if (!habit) return;

        Alert.alert(
            'Usuń nawyk',
            `Czy na pewno chcesz usunąć nawyk "${habit.name}"? Ta akcja jest nieodwracalna.`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: () => {
                        onDelete?.(habit.id);
                        onClose();
                    }
                }
            ]
        );
    };

    if (!visible || !habit) return null;

    const categoryInfo = categoryConfig[habit.category];
    const frequencyInfo = frequencyConfig[habit.frequency];
    const streakQuality = habit.currentStreak >= 21 ? 'excellent' :
        habit.currentStreak >= 7 ? 'good' :
            habit.currentStreak >= 3 ? 'fair' : 'poor';

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.habitIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                            <IconSymbol name={categoryInfo.icon} size={24} color={categoryInfo.color} />
                        </View>
                        <View style={styles.headerInfo}>
                            <ThemedText style={styles.habitTitle}>{habit.name}</ThemedText>
                            <ThemedText style={styles.habitCategory}>{categoryInfo.label}</ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <IconSymbol name="xmark" size={24} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                    {/* Description */}
                    {habit.description && (
                        <View style={styles.section}>
                            <ThemedText style={styles.description}>{habit.description}</ThemedText>
                        </View>
                    )}

                    {/* Key Stats */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Kluczowe statystyki</ThemedText>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <IconSymbol name="flame.fill" size={24} color="#F59E0B" />
                                <ThemedText style={styles.statValue}>{habit.currentStreak}</ThemedText>
                                <ThemedText style={styles.statLabel}>Aktualna passa</ThemedText>
                                {habit.currentStreak >= 7 && (
                                    <View style={styles.statBadge}>
                                        <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.statCard}>
                                <IconSymbol name="trophy" size={24} color="#8B5CF6" />
                                <ThemedText style={styles.statValue}>{habit.longestStreak}</ThemedText>
                                <ThemedText style={styles.statLabel}>Najdłuższa passa</ThemedText>
                                {habit.longestStreak >= 30 && (
                                    <View style={styles.statBadge}>
                                        <IconSymbol name="crown.fill" size={12} color="#F59E0B" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.statCard}>
                                <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
                                <ThemedText style={styles.statValue}>{habit.totalCompletions}</ThemedText>
                                <ThemedText style={styles.statLabel}>Łącznie wykonań</ThemedText>
                            </View>

                            <View style={styles.statCard}>
                                <IconSymbol name="chart.bar.fill" size={24} color="#3B82F6" />
                                <ThemedText style={styles.statValue}>{Math.round(habit.completionRate)}%</ThemedText>
                                <ThemedText style={styles.statLabel}>Skuteczność</ThemedText>
                                {habit.completionRate >= 90 && (
                                    <View style={styles.statBadge}>
                                        <IconSymbol name="checkmark.seal.fill" size={12} color="#10B981" />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Habit Details */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Szczegóły nawyku</ThemedText>
                        <View style={styles.detailsList}>
                            <View style={styles.detailItem}>
                                <IconSymbol name="calendar" size={20} color={frequencyInfo.color} />
                                <ThemedText style={styles.detailLabel}>Częstotliwość</ThemedText>
                                <ThemedText style={styles.detailValue}>{frequencyInfo.label}</ThemedText>
                            </View>

                            <View style={styles.detailItem}>
                                <IconSymbol name="clock" size={20} color="#666" />
                                <ThemedText style={styles.detailLabel}>Utworzono</ThemedText>
                                <ThemedText style={styles.detailValue}>
                                    {new Date(habit.createdAt).toLocaleDateString('pl-PL')}
                                </ThemedText>
                            </View>

                            {habit.targetDays && (
                                <View style={styles.detailItem}>
                                    <IconSymbol name="target" size={20} color="#F59E0B" />
                                    <ThemedText style={styles.detailLabel}>Cel</ThemedText>
                                    <ThemedText style={styles.detailValue}>{habit.targetDays} dni</ThemedText>
                                </View>
                            )}

                            {habit.lastCompletedAt && (
                                <View style={styles.detailItem}>
                                    <IconSymbol name="checkmark.circle" size={20} color="#10B981" />
                                    <ThemedText style={styles.detailLabel}>Ostatnie wykonanie</ThemedText>
                                    <ThemedText style={styles.detailValue}>
                                        {new Date(habit.lastCompletedAt).toLocaleDateString('pl-PL')}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Activity Calendar */}
                    <View style={styles.section}>
                        <StreakCalendar habit={habit} completionDates={completionDates} />
                    </View>

                    {/* Achievements */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Osiągnięcia</ThemedText>
                        <View style={styles.achievementsList}>
                            {habit.currentStreak >= 3 && (
                                <View style={styles.achievement}>
                                    <IconSymbol name="star.fill" size={20} color="#F59E0B" />
                                    <ThemedText style={styles.achievementText}>
                                        Pierwsza passa (3 dni)
                                    </ThemedText>
                                </View>
                            )}

                            {habit.currentStreak >= 7 && (
                                <View style={styles.achievement}>
                                    <IconSymbol name="flame.fill" size={20} color="#EF4444" />
                                    <ThemedText style={styles.achievementText}>
                                        Mocna passa (7 dni)
                                    </ThemedText>
                                </View>
                            )}

                            {habit.currentStreak >= 21 && (
                                <View style={styles.achievement}>
                                    <IconSymbol name="crown.fill" size={20} color="#8B5CF6" />
                                    <ThemedText style={styles.achievementText}>
                                        Mistrz nawyków (21 dni)
                                    </ThemedText>
                                </View>
                            )}

                            {habit.completionRate >= 80 && (
                                <View style={styles.achievement}>
                                    <IconSymbol name="checkmark.seal.fill" size={20} color="#10B981" />
                                    <ThemedText style={styles.achievementText}>
                                        Wysoka skuteczność (80%+)
                                    </ThemedText>
                                </View>
                            )}

                            {habit.totalCompletions >= 50 && (
                                <View style={styles.achievement}>
                                    <IconSymbol name="trophy.fill" size={20} color="#F59E0B" />
                                    <ThemedText style={styles.achievementText}>
                                        Pół setki wykonań
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => {
                            onEdit?.(habit);
                            onClose();
                        }}
                    >
                        <IconSymbol name="pencil" size={16} color="white" />
                        <ThemedText style={styles.editButtonText}>Edytuj</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <IconSymbol name="trash" size={16} color="white" />
                        <ThemedText style={styles.deleteButtonText}>Usuń</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '90%',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    habitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    habitTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 2,
    },
    habitCategory: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
        borderRadius: 8,
    },
    modalBody: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        lineHeight: 24,
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    statBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    detailsList: {
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    detailLabel: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: Colors.light.text,
        fontWeight: '600',
    },
    calendarContainer: {
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 16,
    },
    calendarTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        marginBottom: 12,
    },
    calendarDay: {
        width: (screenWidth - 120) / 15, // Approximate size for mobile
        height: (screenWidth - 120) / 15,
        borderRadius: 2,
        backgroundColor: '#f0f0f0',
    },
    calendarLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    legendText: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    legendDots: {
        flexDirection: 'row',
        gap: 2,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    achievementsList: {
        gap: 8,
    },
    achievement: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    achievementText: {
        fontSize: 14,
        color: Colors.light.text,
        fontWeight: '500',
        flex: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    editButton: {
        backgroundColor: Colors.light.tint,
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});