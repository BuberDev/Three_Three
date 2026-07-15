import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/theme';
import { Task } from '../../lib/types';
import { useAppStore } from '../../stores/app-store';

interface TaskListProps {
    tasks: Task[];
    showCompleted?: boolean;
    emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
    tasks,
    showCompleted = true,
    emptyMessage = "No tasks yet. Create a voice note to add tasks automatically!",
}) => {
    const { toggleTaskCompletion, deleteTask } = useAppStore();

    const filteredTasks = showCompleted
        ? tasks
        : tasks.filter(task => !task.completed);

    const handleToggleComplete = (taskId: string) => {
        toggleTaskCompletion(taskId);
    };

    const handleDeleteTask = (task: Task) => {
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${task.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteTask(task.id)
                },
            ]
        );
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return '#FF6B6B';
            case 'medium': return '#FFA726';
            case 'low': return '#4CAF50';
            default: return Colors.light.tabIconDefault;
        }
    };

    const getPriorityIcon = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'arrow-up';
            case 'medium': return 'remove';
            case 'low': return 'arrow-down';
            default: return 'remove';
        }
    };

    const renderTask = ({ item: task }: { item: Task }) => (
        <View style={[
            styles.taskContainer,
            task.completed && styles.completedTask
        ]}>
            <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleComplete(task.id)}
            >
                <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={task.completed ? '#4CAF50' : Colors.light.tabIconDefault}
                />
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                    <Text style={[
                        styles.taskTitle,
                        task.completed && styles.completedText
                    ]}>
                        {task.title}
                    </Text>
                    <View style={styles.priorityContainer}>
                        <Ionicons
                            name={getPriorityIcon(task.priority)}
                            size={16}
                            color={getPriorityColor(task.priority)}
                        />
                    </View>
                </View>

                {task.description && (
                    <Text style={[
                        styles.taskDescription,
                        task.completed && styles.completedText
                    ]}>
                        {task.description}
                    </Text>
                )}

                <View style={styles.taskMeta}>
                    {task.category && (
                        <View style={styles.category}>
                            <Text style={styles.categoryText}>{task.category}</Text>
                        </View>
                    )}
                    {task.dueDate && (
                        <Text style={styles.dueDate}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                    )}
                    {task.extractedFromVoiceNoteId && (
                        <Ionicons
                            name="mic"
                            size={14}
                            color={Colors.light.tabIconDefault}
                        />
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(task)}
            >
                <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.light.tabIconDefault}
                />
            </TouchableOpacity>
        </View>
    );

    if (filteredTasks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name="checkbox-outline"
                    size={64}
                    color={Colors.light.tabIconDefault}
                />
                <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
        );
    }

    return (
        <View style={styles.listContainer}>
            {filteredTasks.map((task) => (
                <View key={task.id}>
                    {renderTask({ item: task })}
                </View>
            ))}
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
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    completedTask: {
        opacity: 0.7,
        backgroundColor: '#f8f9fa',
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
        color: Colors.light.text,
        lineHeight: 22,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: Colors.light.tabIconDefault,
    },
    priorityContainer: {
        marginLeft: 8,
    },
    taskDescription: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
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
        backgroundColor: Colors.light.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        color: Colors.light.text,
        fontWeight: '500',
    },
    dueDate: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
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
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
});