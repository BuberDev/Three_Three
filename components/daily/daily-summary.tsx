import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { DailyEntry } from '../../lib/types';
import { useAppStore } from '../../stores/app-store';

interface DailySummaryProps {
    entry?: DailyEntry;
    date?: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
    entry,
    date = new Date().toISOString().split('T')[0],
}) => {
    const { generateDailySummary, tasks, voiceNotes } = useAppStore();

    const handleGenerateSummary = () => {
        generateDailySummary();
    };

    const getDateString = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    const getCompletionStats = () => {
        const todaysTasks = tasks.filter(task => {
            const taskDate = task.dueDate?.split('T')[0];
            return taskDate === date || (!task.completed && !taskDate);
        });

        const completed = todaysTasks.filter(t => t.completed).length;
        const total = todaysTasks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage };
    };

    const getMoodIcon = (mood: string) => {
        switch (mood.toLowerCase()) {
            case 'happy': return 'happy-outline';
            case 'sad': return 'sad-outline';
            case 'excited': return 'flame-outline';
            case 'calm': return 'leaf-outline';
            case 'anxious': return 'alert-circle-outline';
            case 'focused': return 'eye-outline';
            default: return 'ellipse-outline';
        }
    };

    const getMoodColor = (mood: string) => {
        switch (mood.toLowerCase()) {
            case 'happy': return '#4CAF50';
            case 'sad': return '#2196F3';
            case 'excited': return '#FF5722';
            case 'calm': return '#009688';
            case 'anxious': return '#FF9800';
            case 'focused': return '#673AB7';
            default: return Colors.light.tabIconDefault;
        }
    };

    const stats = getCompletionStats();
    const todaysNotes = voiceNotes.filter(note =>
        note.createdAt.startsWith(date)
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>Daily Summary</Text>
                <Text style={styles.date}>{getDateString(date)}</Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="mic" size={24} color="#4CAF50" />
                    <Text style={styles.statNumber}>{todaysNotes.length}</Text>
                    <Text style={styles.statLabel}>Voice Notes</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                    <Text style={styles.statNumber}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="list" size={24} color="#FF9800" />
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>
                    Task Completion: {stats.percentage}%
                </Text>
                <View style={styles.progressBar}>
                    <LinearGradient
                        colors={['#4CAF50', '#45A049']}
                        style={[
                            styles.progressFill,
                            { width: `${stats.percentage}%` }
                        ]}
                    />
                </View>
            </View>

            {/* Auto Summary */}
            {entry ? (
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>AI Summary</Text>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryText}>{entry.autoSummary}</Text>
                    </View>

                    {entry.mood && (
                        <View style={styles.moodSection}>
                            <Text style={styles.sectionTitle}>Mood</Text>
                            <View style={styles.moodCard}>
                                <Ionicons
                                    name={getMoodIcon(entry.mood)}
                                    size={32}
                                    color={getMoodColor(entry.mood)}
                                />
                                <Text style={[
                                    styles.moodText,
                                    { color: getMoodColor(entry.mood) }
                                ]}>
                                    {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {entry.habits && entry.habits.length > 0 && (
                        <View style={styles.habitsSection}>
                            <Text style={styles.sectionTitle}>Habits Tracked</Text>
                            {entry.habits.map((habit, index) => (
                                <View key={index} style={styles.habitCard}>
                                    {(() => {
                                        const isCompleted = habit.isCompletedToday;
                                        const streakCount = habit.currentStreak;
                                        return (
                                            <>
                                                <Ionicons
                                                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                                                    size={20}
                                                    color={isCompleted ? '#4CAF50' : Colors.light.tabIconDefault}
                                                />
                                                <Text style={styles.habitName}>{habit.name}</Text>
                                                {streakCount > 0 && (
                                                    <Text style={styles.streakText}>
                                                        {streakCount} day streak
                                                    </Text>
                                                )}
                                            </>
                                        );
                                    })()}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.noSummarySection}>
                    <Ionicons
                        name="document-text-outline"
                        size={48}
                        color={Colors.light.tabIconDefault}
                    />
                    <Text style={styles.noSummaryText}>
                        No summary generated yet for {getDateString(date)}
                    </Text>
                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleGenerateSummary}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45A049']}
                            style={styles.generateGradient}
                        >
                            <Ionicons name="sparkles" size={20} color="white" />
                            <Text style={styles.generateButtonText}>Generate Summary</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    date: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    statCard: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
        marginTop: 4,
    },
    progressSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    progressLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    summarySection: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.text,
    },
    moodSection: {
        marginBottom: 20,
    },
    moodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    moodText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    habitsSection: {
        marginBottom: 20,
    },
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    habitName: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.text,
        marginLeft: 12,
    },
    streakText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    noSummarySection: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    noSummaryText: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    generateButton: {
        overflow: 'hidden',
        borderRadius: 25,
    },
    generateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    generateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
