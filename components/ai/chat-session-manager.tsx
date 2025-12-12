import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, DesignSystem } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
    type: 'general' | 'project' | 'analysis' | 'coding';
}

interface ChatSessionManagerProps {
    sessions: ChatSession[];
    onSelectSession: (session: ChatSession) => void;
    onCreateSession: (title: string, type: ChatSession['type']) => void;
    onDeleteSession: (sessionId: string) => void;
}

export const ChatSessionManager: React.FC<ChatSessionManagerProps> = ({
    sessions,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [selectedType, setSelectedType] = useState<ChatSession['type']>('general');

    const handleCreateSession = () => {
        if (newTitle.trim()) {
            onCreateSession(newTitle.trim(), selectedType);
            setNewTitle('');
            setSelectedType('general');
            setShowCreateForm(false);
        }
    };

    const getTypeIcon = (type: ChatSession['type']): 'chatbubble' | 'folder' | 'analytics' | 'code' => {
        switch (type) {
            case 'general': return 'chatbubble';
            case 'project': return 'folder';
            case 'analysis': return 'analytics';
            case 'coding': return 'code';
            default: return 'chatbubble';
        }
    };

    const getTypeLabel = (type: ChatSession['type']) => {
        switch (type) {
            case 'general': return 'Ogólna';
            case 'project': return 'Projekt';
            case 'analysis': return 'Analiza';
            case 'coding': return 'Kod';
            default: return 'Ogólna';
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Dzisiaj';
        if (days === 1) return 'Wczoraj';
        if (days < 7) return `${days} dni temu`;
        return date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short'
        });
    };

    const renderSession = ({ item }: { item: ChatSession }) => (
        <TouchableOpacity
            style={[styles.sessionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onSelectSession(item)}
        >
            <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                    <View style={[styles.typeIndicator, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name={getTypeIcon(item.type)} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.sessionDetails}>
                        <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                            {getTypeLabel(item.type)} • {item.messageCount} wiadomości
                        </Text>
                    </View>
                </View>
                <View style={styles.sessionActions}>
                    <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                        {formatTimestamp(item.timestamp)}
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDeleteSession(item.id)}
                    >
                        <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.lastMessage}
            </Text>
        </TouchableOpacity>
    );

    if (showCreateForm) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setShowCreateForm(false)}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Nowa konwersacja
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.formContainer}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>
                        Nazwa konwersacji
                    </Text>
                    <TextInput
                        style={[styles.titleInput, {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text
                        }]}
                        placeholder="Nazwa konwersacji..."
                        placeholderTextColor={colors.textSecondary}
                        value={newTitle}
                        onChangeText={setNewTitle}
                        autoFocus
                    />

                    <Text style={[styles.formLabel, { color: colors.text }]}>
                        Typ konwersacji
                    </Text>
                    <View style={styles.typeSelector}>
                        {(['general', 'project', 'analysis', 'coding'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeButton,
                                    {
                                        backgroundColor: selectedType === type ? colors.primary + '15' : colors.surface,
                                        borderColor: selectedType === type ? colors.primary : colors.border,
                                    }
                                ]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Ionicons
                                    name={getTypeIcon(type)}
                                    size={20}
                                    color={selectedType === type ? colors.primary : colors.textSecondary}
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    {
                                        color: selectedType === type ? colors.primary : colors.textSecondary
                                    }
                                ]}>
                                    {getTypeLabel(type)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            {
                                backgroundColor: newTitle.trim() ? colors.primary : colors.surface,
                                borderColor: colors.border
                            }
                        ]}
                        onPress={handleCreateSession}
                        disabled={!newTitle.trim()}
                    >
                        <Text style={[
                            styles.createButtonText,
                            {
                                color: newTitle.trim() ? colors.background : colors.textSecondary
                            }
                        ]}>
                            Utwórz konwersację
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>
                    AI Assistant
                </Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowCreateForm(true)}
                >
                    <Ionicons name="add" size={24} color={colors.background} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sessions}
                renderItem={renderSession}
                keyExtractor={(item) => item.id}
                style={styles.sessionsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                            Brak konwersacji
                        </Text>
                        <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
                            Utwórz nową konwersację aby rozpocząć chat z AI Assistant
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyCreateButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowCreateForm(true)}
                        >
                            <Ionicons name="add" size={20} color={colors.background} />
                            <Text style={[styles.emptyCreateText, { color: colors.background }]}>
                                Utwórz pierwszą konwersację
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
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
    backButton: {
        padding: DesignSystem.spacing.sm,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionsList: {
        flex: 1,
    },
    listContainer: {
        padding: DesignSystem.spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DesignSystem.spacing.xl,
    },
    sessionItem: {
        padding: DesignSystem.spacing.lg,
        marginBottom: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.lg,
        borderWidth: 1,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: DesignSystem.spacing.sm,
    },
    sessionInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: DesignSystem.spacing.md,
    },
    typeIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionDetails: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    sessionMeta: {
        fontSize: 12,
        opacity: 0.8,
    },
    sessionActions: {
        alignItems: 'flex-end',
        gap: DesignSystem.spacing.xs,
    },
    timestamp: {
        fontSize: 11,
        opacity: 0.6,
    },
    deleteButton: {
        padding: DesignSystem.spacing.xs,
    },
    lastMessage: {
        fontSize: 14,
        lineHeight: 18,
        opacity: 0.7,
    },
    emptyState: {
        alignItems: 'center',
        gap: DesignSystem.spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptyDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginHorizontal: DesignSystem.spacing.xl,
    },
    emptyCreateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
        paddingHorizontal: DesignSystem.spacing.lg,
        paddingVertical: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.lg,
        marginTop: DesignSystem.spacing.md,
    },
    emptyCreateText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Form styles
    formContainer: {
        padding: DesignSystem.spacing.lg,
        gap: DesignSystem.spacing.lg,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: DesignSystem.spacing.sm,
    },
    titleInput: {
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.lg,
        padding: DesignSystem.spacing.md,
        fontSize: 16,
    },
    typeSelector: {
        gap: DesignSystem.spacing.sm,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.md,
        padding: DesignSystem.spacing.md,
        borderWidth: 1,
        borderRadius: DesignSystem.borderRadius.lg,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    createButton: {
        padding: DesignSystem.spacing.lg,
        borderRadius: DesignSystem.borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        marginTop: DesignSystem.spacing.lg,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});