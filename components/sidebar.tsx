import { router } from 'expo-router';
import React from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppStore } from '@/stores/app-store';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

interface SidebarProps {
    readonly visible: boolean;
    readonly onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.75; // 75% szerokości ekranu

export function Sidebar({ visible, onClose }: SidebarProps) {
    const insets = useSafeAreaInsets();
    const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const overlayOpacity = React.useRef(new Animated.Value(0)).current;

    // Pobieramy dane z store
    const { tasks, todaysTasks, todaysActivities, loadTasks, loadActivities } = useAppStore();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const surfaceColor = useThemeColor({}, 'surface'); React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const navigationItems = [
        {
            id: 'home',
            title: 'Strona główna',
            icon: 'house.fill',
            route: '/(tabs)/',
            description: 'Przegląd aktywności i zadań'
        },
        {
            id: 'routines',
            title: 'Lista & Rutyny',
            icon: 'list.bullet',
            route: '/(tabs)/routines',
            description: 'Zarządzaj zadaniami i rutyną'
        },
        {
            id: 'voice',
            title: 'Notatki głosowe',
            icon: 'mic.fill',
            route: '/(tabs)/voice',
            description: 'Nagrywaj i organizuj notatki'
        },
        {
            id: 'sleep',
            title: 'Sen',
            icon: 'moon.fill',
            route: '/(tabs)/sleep',
            description: 'Monitoruj jakość snu'
        },
        {
            id: 'ai',
            title: 'Asystent AI',
            icon: 'brain',
            route: '/(tabs)/ai',
            description: 'Rozmowa z AI i analiza'
        },
        {
            id: 'profile',
            title: 'Profil',
            icon: 'person.fill',
            route: '/(tabs)/profile',
            description: 'Ustawienia i personalizacja'
        },
    ];

    const quickActions = [
        {
            id: 'add-task',
            title: 'Dodaj zadanie',
            icon: 'plus.circle.fill',
            action: () => {
                onClose();
                // Tutaj można dodać logikę dodawania zadania
            }
        },
        {
            id: 'record-voice',
            title: 'Nagraj notatkę',
            icon: 'waveform.circle.fill',
            action: () => {
                onClose();
                router.push('/(tabs)/voice');
            }
        },
        {
            id: 'quick-entry',
            title: 'Szybki wpis',
            icon: 'square.and.pencil',
            action: () => {
                onClose();
                // Tutaj można dodać logikę szybkiego wpisu
            }
        },
    ];

    const handleNavigate = (route: string) => {
        onClose();
        router.push(route as any);
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {/* Overlay */}
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: overlayOpacity,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    onPress={onClose}
                    activeOpacity={1}
                />
            </Animated.View>

            {/* Sidebar */}
            <Animated.View
                style={[
                    styles.sidebar,
                    {
                        backgroundColor: surfaceColor,
                        transform: [{ translateX: slideAnim }],
                        paddingTop: insets.top,
                    },
                ]}
            >
                <View style={styles.sidebarContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <IconSymbol
                                    name="brain"
                                    size={28}
                                    color={Colors.light.tint}
                                />
                                <ThemedText variant="titleLarge" style={[styles.appTitle, { color: textColor }]}>
                                    Three Three
                                </ThemedText>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <IconSymbol name="xmark" size={24} color={textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Navigation */}
                        <View style={styles.section}>
                            <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: textSecondary }]}>
                                NAWIGACJA
                            </ThemedText>
                            {navigationItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.navigationItem, { backgroundColor: backgroundColor + '80' }]}
                                    onPress={() => handleNavigate(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.navigationItemContent}>
                                        <IconSymbol
                                            name={item.icon as any}
                                            size={20}
                                            color={Colors.light.tint}
                                        />
                                        <View style={styles.navigationTextContainer}>
                                            <ThemedText variant="bodyLarge" style={[styles.navigationTitle, { color: textColor }]}>
                                                {item.title}
                                            </ThemedText>
                                            <ThemedText variant="bodySmall" style={[styles.navigationDescription, { color: textSecondary }]}>
                                                {item.description}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={16} color={textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Recent Tasks */}
                        <View style={styles.section}>
                            <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: textSecondary }]}>
                                OSTATNIE ZADANIA
                            </ThemedText>
                            {tasks.slice(0, 4).map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    style={[styles.dataItem, { backgroundColor: backgroundColor + '80' }]}
                                    onPress={() => {
                                        onClose();
                                        router.push('/(tabs)/routines');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.taskItemContent}>
                                        <View style={[
                                            styles.taskStatus,
                                            { backgroundColor: task.completed ? Colors.light.success : Colors.light.warning }
                                        ]} />
                                        <View style={styles.taskTextContainer}>
                                            <ThemedText
                                                variant="bodyMedium"
                                                style={[
                                                    styles.taskTitle,
                                                    { color: textColor },
                                                    task.completed && styles.completedTask
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {task.title}
                                            </ThemedText>
                                            <ThemedText variant="bodySmall" style={[styles.taskMeta, { color: textSecondary }]}>
                                                {task.completed ? 'Wykonane' : `Priorytet: ${task.priority}`}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={12} color={textSecondary} />
                                </TouchableOpacity>
                            ))}
                            {tasks.length === 0 && (
                                <View style={styles.emptySection}>
                                    <ThemedText variant="bodySmall" style={[styles.emptyText, { color: textSecondary }]}>
                                        Brak zadań
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {/* Today's Activities */}
                        <View style={styles.section}>
                            <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: textSecondary }]}>
                                DZISIEJSZE AKTYWNOŚCI
                            </ThemedText>
                            {(todaysActivities || []).slice(0, 3).map((activity, index) => (
                                <TouchableOpacity
                                    key={activity.id || index}
                                    style={[styles.dataItem, { backgroundColor: backgroundColor + '80' }]}
                                    onPress={() => {
                                        onClose();
                                        router.push('/(tabs)');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.activityItemContent}>
                                        <IconSymbol
                                            name="clock.fill"
                                            size={16}
                                            color={Colors.light.tint}
                                        />
                                        <View style={styles.activityTextContainer}>
                                            <ThemedText
                                                variant="bodyMedium"
                                                style={[styles.activityTitle, { color: textColor }]}
                                                numberOfLines={1}
                                            >
                                                {activity.title || 'Aktywność'}
                                            </ThemedText>
                                            <ThemedText variant="bodySmall" style={[styles.activityMeta, { color: textSecondary }]}>
                                                {activity.startTime ? new Date(activity.startTime).toLocaleTimeString('pl-PL', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Dziś'}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={12} color={textSecondary} />
                                </TouchableOpacity>
                            ))}
                            {(!todaysActivities || todaysActivities.length === 0) && (
                                <View style={styles.emptySection}>
                                    <ThemedText variant="bodySmall" style={[styles.emptyText, { color: textSecondary }]}>
                                        Brak aktywności na dziś
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {/* Quick Actions */}
                        <View style={styles.section}>
                            <ThemedText variant="titleSmall" style={[styles.sectionTitle, { color: textSecondary }]}>
                                SZYBKIE AKCJE
                            </ThemedText>
                            {quickActions.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.quickActionItem, { backgroundColor: backgroundColor + '80' }]}
                                    onPress={item.action}
                                    activeOpacity={0.7}
                                >
                                    <IconSymbol
                                        name={item.icon as any}
                                        size={18}
                                        color={Colors.light.tint}
                                    />
                                    <ThemedText variant="bodyMedium" style={[styles.quickActionTitle, { color: textColor }]}>
                                        {item.title}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText variant="bodySmall" style={[styles.footerText, { color: textSecondary }]}>
                                Three Three © 2025
                            </ThemedText>
                            <ThemedText variant="bodySmall" style={[styles.footerText, { color: textSecondary }]}>
                                Wersja 1.0.0
                            </ThemedText>
                        </View>
                    </ScrollView>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayTouchable: {
        flex: 1,
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    sidebarContent: {
        flex: 1,
    },
    header: {
        padding: DesignSystem.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.sm,
    },
    appTitle: {
        fontWeight: '700',
    },
    closeButton: {
        padding: DesignSystem.spacing.xs,
        borderRadius: DesignSystem.borderRadius.sm,
    },
    scrollContent: {
        flex: 1,
    },
    section: {
        paddingHorizontal: DesignSystem.spacing.lg,
        paddingVertical: DesignSystem.spacing.md,
    },
    sectionTitle: {
        fontWeight: '600',
        marginBottom: DesignSystem.spacing.sm,
        letterSpacing: 0.5,
    },
    navigationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: DesignSystem.spacing.xs,
    },
    navigationItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: DesignSystem.spacing.sm,
    },
    navigationTextContainer: {
        flex: 1,
    },
    navigationTitle: {
        fontWeight: '500',
        marginBottom: 2,
    },
    navigationDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: DesignSystem.spacing.xs,
        gap: DesignSystem.spacing.sm,
    },
    quickActionTitle: {
        fontWeight: '500',
    },
    dataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: DesignSystem.spacing.xs,
        gap: DesignSystem.spacing.sm,
    },
    taskItemContent: {
        flex: 1,
    },
    taskStatus: {
        fontSize: 11,
        opacity: 0.7,
        marginTop: 2,
    },
    activityItemContent: {
        flex: 1,
    },
    emptySection: {
        paddingHorizontal: DesignSystem.spacing.md,
        paddingVertical: DesignSystem.spacing.lg,
        alignItems: 'center',
        opacity: 0.5,
    },
    footer: {
        paddingHorizontal: DesignSystem.spacing.lg,
        paddingVertical: DesignSystem.spacing.xl,
        alignItems: 'center',
        gap: 4,
    },
    taskTextContainer: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    completedTask: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    taskMeta: {
        fontSize: 12,
        opacity: 0.8,
    },
    activityTextContainer: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    activityMeta: {
        fontSize: 12,
        opacity: 0.8,
    },
    emptyText: {
        fontSize: 12,
        fontStyle: 'italic',
        opacity: 0.6,
    },
    footerText: {
        fontSize: 11,
    },
});