import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DesignSystem } from '../../constants/theme';
import { Task } from '../../lib/types';
import { useAppStore } from '../../stores/app-store';
import { IconSymbol } from '../ui/icon-symbol';

interface TaskListProps {
    tasks: Task[];
    showCompleted?: boolean;
    emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
    tasks,
    showCompleted = true,
    emptyMessage = "Brak zadań. Nagraj notatkę głosową, aby automatycznie dodać zadania!",
}) => {
    const { toggleTaskCompletion, deleteTask } = useAppStore();
    const surfaceColor = useThemeColor({}, 'surface');
    const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const iconSecondary = useThemeColor({}, 'iconSecondary');
    const successColor = useThemeColor({}, 'success');
    const errorColor = useThemeColor({}, 'error');
    const warningColor = useThemeColor({}, 'warning');
    const backgroundColor = useThemeColor({}, 'background');

    const filteredTasks = showCompleted
        ? tasks
        : tasks.filter(task => !task.completed);

    const handleToggleComplete = (taskId: string) => {
        toggleTaskCompletion(taskId);
    };

    const handleDeleteTask = (task: Task) => {
        Alert.alert(
            'Usuń zadanie',
            `Czy na pewno chcesz usunąć "${task.title}"?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: () => deleteTask(task.id)
                },
            ]
        );
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return errorColor;
            case 'medium': return warningColor;
            case 'low': return successColor;
            default: return iconSecondary;
        }
    };

    const getPriorityIcon = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'arrow.up';
            case 'medium': return 'minus';
            case 'low': return 'arrow.down';
            default: return 'minus';
        }
    };

    const renderTask = (task: Task) => (
        <View
            key={task.id}
            style={[
                styles.taskContainer,
                { backgroundColor: surfaceColor, ...DesignSystem.elevation[1] },
                task.completed && { backgroundColor: surfaceSecondary, opacity: 0.7 }
            ]}
        >
            <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleComplete(task.id)}
            >
                <IconSymbol
                    name={task.completed ? 'checkmark.circle.fill' : 'circle'}
                    size={24}
                    color={task.completed ? successColor : iconSecondary}
                />
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                    <Text style={[
                        styles.taskTitle,
                        { color: textColor },
                        task.completed && { color: iconSecondary, textDecorationLine: 'line-through' }
                    ]}>
                        {task.title}
                    </Text>
                    <View style={styles.priorityContainer}>
                        <IconSymbol
                            name={getPriorityIcon(task.priority)}
                            size={16}
                            color={getPriorityColor(task.priority)}
                        />
                    </View>
                </View>

                {task.description && (
                    <Text style={[
                        styles.taskDescription,
                        { color: textSecondary },
                        task.completed && { color: iconSecondary, textDecorationLine: 'line-through' }
                    ]}>
                        {task.description}
                    </Text>
                )}

                <View style={styles.taskMeta}>
                    {task.category && (
                        <View style={[styles.category, { backgroundColor }]}>
                            <Text style={[styles.categoryText, { color: textColor }]}>{task.category}</Text>
                        </View>
                    )}
                    {task.dueDate && (
                        <Text style={[styles.dueDate, { color: textSecondary }]}>
                            Termin: {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                        </Text>
                    )}
                    {task.extractedFromVoiceNoteId && (
                        <IconSymbol name="mic" size={14} color={textSecondary} />
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(task)}
            >
                <IconSymbol name="trash" size={20} color={textSecondary} />
            </TouchableOpacity>
        </View>
    );

    if (filteredTasks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <IconSymbol name="checklist" size={64} color={iconSecondary} />
                <Text style={[styles.emptyText, { color: textSecondary }]}>{emptyMessage}</Text>
            </View>
        );
    }

    return (
        <View style={styles.listContainer}>
            {filteredTasks.map(renderTask)}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 8,
        paddingBottom: 20,
    },
    taskContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginVertical: 4,
        borderRadius: DesignSystem.borderRadius.md,
    },
    checkbox: {
        marginRight: 12,
        marginTop: 2,
    },
    taskContent: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    taskTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    priorityContainer: {
        marginLeft: 8,
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    category: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dueDate: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 4,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
});
