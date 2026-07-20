import LinearGradient from 'react-native-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HabitStats } from '@/lib/types';

interface HabitChartsProps {
    habitStats: HabitStats | null;
    selectedPeriod: 'week' | 'month' | 'year';
    onPeriodChange: (period: 'week' | 'month' | 'year') => void;
    data?: any;
}

interface WeeklyProgressChartProps {
    data: Array<{
        date: string;
        completions: number;
        totalHabits: number;
    }>;
    maxValue: number;
}

interface StreakVisualizationProps {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
}

interface CategoryBreakdownProps {
    categoryData: Record<string, number>;
    totalHabits: number;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 200;

// Enterprise-grade design tokens and color system
const designTokens = {
    colors: {
        primary: {
            gradient: ['#667eea', '#764ba2'] as const,
            base: '#667eea',
            light: '#8f9df7',
            dark: '#4c63d2'
        },
        success: {
            gradient: ['#11998e', '#38ef7d'] as const,
            base: '#10B981',
            light: '#6EE7B7',
            dark: '#047857'
        },
        warning: {
            gradient: ['#f093fb', '#f5576c'] as const,
            base: '#F59E0B',
            light: '#FCD34D',
            dark: '#D97706'
        },
        danger: {
            gradient: ['#fc466b', '#3f5efb'] as const,
            base: '#EF4444',
            light: '#FCA5A5',
            dark: '#DC2626'
        }
    },
    shadows: {
        card: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 24,
            elevation: 12
        },
        bar: {
            shadowColor: '#667eea',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6
        }
    },
    borderRadius: {
        small: 8,
        medium: 12,
        large: 16,
        xl: 24
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
    }
};

const categoryConfig = {
    health: {
        color: '#10B981',
        gradient: ['#10B981', '#34D399'] as const,
        label: 'Zdrowie',
        icon: 'heart.fill'
    },
    productivity: {
        color: '#3B82F6',
        gradient: ['#3B82F6', '#60A5FA'] as const,
        label: 'Produktywność',
        icon: 'bolt.fill'
    },
    learning: {
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#A78BFA'] as const,
        label: 'Nauka',
        icon: 'book.fill'
    },
    personal: {
        color: '#F59E0B',
        gradient: ['#F59E0B', '#FBBF24'] as const,
        label: 'Osobiste',
        icon: 'person.fill'
    },
    fitness: {
        color: '#EF4444',
        gradient: ['#EF4444', '#F87171'] as const,
        label: 'Fitness',
        icon: 'figure.run'
    },
    mindfulness: {
        color: '#A855F7',
        gradient: ['#A855F7', '#C084FC'] as const,
        label: 'Mindfulness',
        icon: 'leaf.fill'
    },
    social: {
        color: '#06B6D4',
        gradient: ['#06B6D4', '#22D3EE'] as const,
        label: 'Społeczne',
        icon: 'person.2.fill'
    },
    financial: {
        color: '#84CC16',
        gradient: ['#84CC16', '#A3E635'] as const,
        label: 'Finanse',
        icon: 'dollarsign.circle.fill'
    },
};

function WeeklyProgressChart({ data, maxValue }: WeeklyProgressChartProps) {
    const barWidth = (chartWidth - 80) / 7;
    const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!isAnimating) {
            setIsAnimating(true);
            // Staggered animation for professional effect
            const animations = animatedValues.map((animValue, index) => {
                const completionRate = data[index] && data[index].totalHabits > 0
                    ? data[index].completions / data[index].totalHabits
                    : 0;

                return Animated.timing(animValue, {
                    toValue: completionRate,
                    duration: 800,
                    delay: index * 100, // Staggered effect
                    easing: Easing.bezier(0.4, 0, 0.2, 1), // Material Design easing
                    useNativeDriver: false,
                });
            });

            Animated.parallel(animations).start();
        }
    }, [data]);

    const getBarGradient = (completionRate: number): readonly [string, string, ...string[]] => {
        if (completionRate >= 0.8) return designTokens.colors.success.gradient;
        if (completionRate >= 0.5) return designTokens.colors.warning.gradient;
        return designTokens.colors.danger.gradient;
    };

    return (
        <View style={[styles.chartContainer, designTokens.shadows.card]}>
            <View style={styles.chartHeader}>
                <View style={styles.chartTitleContainer}>
                    <IconSymbol name="chart.bar.fill" size={20} color={designTokens.colors.primary.base} />
                    <ThemedText style={styles.chartTitle}>Postęp w ostatnim tygodniu</ThemedText>
                </View>
                <View style={styles.completionSummary}>
                    <ThemedText style={styles.completionText}>
                        {Math.round((data.reduce((acc, day: { completions: number; totalHabits: number }) => acc + day.completions, 0) /
                            data.reduce((acc, day: { completions: number; totalHabits: number }) => acc + day.totalHabits, 0)) * 100) || 0}%
                    </ThemedText>
                </View>
            </View>

            <View style={styles.chartContent}>
                <View style={styles.yAxisContainer}>
                    {[...Array(6)].map((_, index) => {
                        const value = Math.round((maxValue / 5) * (5 - index));
                        return (
                            <ThemedText key={index} style={styles.yAxisLabel}>
                                {value}
                            </ThemedText>
                        );
                    })}
                </View>

                <View style={styles.chartArea}>
                    {/* Professional grid lines with gradients */}
                    {[...Array(6)].map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.gridLine,
                                { top: (chartHeight / 5) * index }
                            ]}
                        />
                    ))}

                    {/* Enhanced bars with animations and gradients */}
                    <View style={styles.barsContainer}>
                        {data.map((day, index) => {
                            const completionRate = day.totalHabits > 0 ? day.completions / day.totalHabits : 0;
                            const dayName = new Date(day.date).toLocaleDateString('pl-PL', { weekday: 'short' });
                            const gradientColors = getBarGradient(completionRate);

                            return (
                                <TouchableOpacity
                                    key={day.date}
                                    style={[styles.barContainer, { width: barWidth }]}
                                    activeOpacity={0.7}
                                >
                                    <Animated.View
                                        style={[
                                            styles.barWrapper,
                                            {
                                                height: animatedValues[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [4, chartHeight], // Minimum height for visibility
                                                }),
                                                transform: [{
                                                    scaleY: animatedValues[index]
                                                }]
                                            }
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={gradientColors as [string, string]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={[
                                                styles.bar,
                                                designTokens.shadows.bar
                                            ]}
                                        />

                                        {/* Completion indicator */}
                                        <View style={styles.completionBadge}>
                                            <ThemedText style={styles.completionBadgeText}>
                                                {day.completions}/{day.totalHabits}
                                            </ThemedText>
                                        </View>
                                    </Animated.View>

                                    <ThemedText style={styles.barLabel}>{dayName}</ThemedText>
                                    <ThemedText style={styles.barValue}>
                                        {day.completions}/{day.totalHabits}
                                    </ThemedText>

                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View >
    );
}

function StreakVisualization({ currentStreak, longestStreak, completionRate }: StreakVisualizationProps) {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Smooth entrance animation
        Animated.parallel([
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const getStreakGradient = (streak: number): readonly [string, string, ...string[]] => {
        if (streak >= 21) return designTokens.colors.success.gradient;
        if (streak >= 7) return designTokens.colors.warning.gradient;
        if (streak >= 3) return designTokens.colors.primary.gradient;
        return designTokens.colors.danger.gradient;
    };

    const CircularProgress = ({ value, maxValue, size, strokeWidth, gradient, label, icon }: {
        value: number;
        maxValue: number;
        size: number;
        strokeWidth: number;
        gradient: readonly [string, string, ...string[]];
        label: string;
        icon: string;
    }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = circumference;
        const normalizedValue = Math.min(value / maxValue, 1);

        const animatedStrokeDashoffset = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, circumference * (1 - normalizedValue)],
        });

        return (
            <Animated.View
                style={[styles.circularProgressContainer, { transform: [{ scale: scaleAnim }] }]}
            >
                <View style={[styles.circularProgressWrapper, { width: size, height: size }]}>
                    {/* Background circle */}
                    <View
                        style={[
                            styles.circularProgressBg,
                            {
                                width: size,
                                height: size,
                                borderRadius: size / 2,
                                borderWidth: strokeWidth,
                            }
                        ]}
                    />

                    {/* Progress circle with gradient effect */}
                    <Animated.View
                        style={[
                            styles.circularProgressForeground,
                            {
                                width: size,
                                height: size,
                                borderRadius: size / 2,
                                borderWidth: strokeWidth,
                                borderColor: gradient[0],
                                transform: [{
                                    rotate: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', `${360 * normalizedValue}deg`],
                                    })
                                }]
                            }
                        ]}
                    />

                    {/* Center content */}
                    <View style={styles.circularProgressCenter}>
                        <IconSymbol name={icon} size={24} color={gradient[0]} />
                        <ThemedText style={[styles.circularProgressValue, { color: gradient[0] }]}>
                            {value}
                        </ThemedText>
                        <ThemedText style={styles.circularProgressUnit}>
                            {maxValue > 100 ? 'dni' : '%'}
                        </ThemedText>
                    </View>
                </View>
                <ThemedText style={styles.circularProgressLabel}>{label}</ThemedText>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.streakContainer, designTokens.shadows.card]}>
            <View style={styles.chartHeader}>
                <View style={styles.chartTitleContainer}>
                    <IconSymbol name="flame.fill" size={20} color={designTokens.colors.warning.base} />
                    <ThemedText style={styles.chartTitle}>Analiza postępów</ThemedText>
                </View>
            </View>

            <View style={styles.progressIndicatorsRow}>
                <CircularProgress
                    value={currentStreak}
                    maxValue={Math.max(longestStreak, 30)}
                    size={100}
                    strokeWidth={6}
                    gradient={getStreakGradient(currentStreak)}
                    label="Aktualna passa"
                    icon="flame.fill"
                />

                <CircularProgress
                    value={completionRate}
                    maxValue={100}
                    size={100}
                    strokeWidth={6}
                    gradient={designTokens.colors.primary.gradient}
                    label="Skuteczność"
                    icon="chart.pie.fill"
                />

                <CircularProgress
                    value={longestStreak}
                    maxValue={Math.max(longestStreak, 30)}
                    size={100}
                    strokeWidth={6}
                    gradient={designTokens.colors.success.gradient}
                    label="Najlepsza passa"
                    icon="trophy.fill"
                />
            </View>

            {/* Achievement badges */}
            <View style={styles.achievementSection}>
                <ThemedText style={styles.achievementTitle}>Osiągnięcia</ThemedText>
                <View style={styles.achievementBadges}>
                    {[
                        { threshold: 7, icon: 'star.fill', label: '7 dni', achieved: currentStreak >= 7 },
                        { threshold: 14, icon: 'star.fill', label: '14 dni', achieved: currentStreak >= 14 },
                        { threshold: 21, icon: 'crown.fill', label: '21 dni', achieved: currentStreak >= 21 },
                        { threshold: 30, icon: 'diamond.fill', label: '30 dni', achieved: currentStreak >= 30 },
                    ].map((achievement, index) => (
                        <View
                            key={index}
                            style={[
                                styles.achievementBadge,
                                achievement.achieved && styles.achievementBadgeActive
                            ]}
                        >
                            <IconSymbol
                                name={achievement.icon}
                                size={16}
                                color={achievement.achieved ? designTokens.colors.warning.base : '#ccc'}
                            />
                            <ThemedText
                                style={[
                                    styles.achievementText,
                                    achievement.achieved && styles.achievementTextActive
                                ]}
                            >
                                {achievement.label}
                            </ThemedText>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}
// Helper functions for streak and completion colors
const getStreakColor = (streak: number): string => {
    if (streak >= 21) return designTokens.colors.success.base;
    if (streak >= 7) return designTokens.colors.warning.base;
    if (streak >= 3) return designTokens.colors.primary.base;
    return designTokens.colors.danger.base;
};

const getCompletionRateColor = (rate: number): string => {
    if (rate >= 80) return designTokens.colors.success.base;
    if (rate >= 60) return designTokens.colors.warning.base;
    if (rate >= 40) return designTokens.colors.primary.base;
    return designTokens.colors.danger.base;
};

// Professional Enterprise Streak Cards Component
function EnterpriseStreakCards({ currentStreak, longestStreak, completionRate }: {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
}) {
    const scaleAnim = useRef([
        new Animated.Value(0.8),
        new Animated.Value(0.8),
        new Animated.Value(0.8)
    ]).current;

    useEffect(() => {
        const animations = scaleAnim.map((anim, index) =>
            Animated.spring(anim, {
                toValue: 1,
                delay: index * 150,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            })
        );

        Animated.stagger(100, animations).start();
    }, []);

    const streakCards = [
        {
            value: currentStreak,
            label: 'Aktualna passa',
            icon: 'flame.fill',
            color: getStreakColor(currentStreak),
            achievementThreshold: 7,
            achievementIcon: 'star.fill',
            index: 0
        },
        {
            value: longestStreak,
            label: 'Najdłuższa passa',
            icon: 'trophy.fill',
            color: designTokens.colors.success.base,
            achievementThreshold: 30,
            achievementIcon: 'crown.fill',
            index: 1
        },
        {
            value: `${Math.round(completionRate)}%`,
            label: 'Skuteczność',
            icon: 'chart.bar.fill',
            color: getCompletionRateColor(completionRate),
            achievementThreshold: 90,
            achievementIcon: 'checkmark.seal.fill',
            index: 2
        }
    ];

    return (
        <View style={styles.streakCardsContainer}>
            <View style={styles.chartHeader}>
                <View style={styles.chartTitleContainer}>
                    <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={designTokens.colors.primary.base} />
                    <ThemedText style={styles.chartTitle}>Statystyki postępów</ThemedText>
                </View>
            </View>

            <View style={styles.streakCardRow}>
                {streakCards.map((card) => (
                    <Animated.View
                        key={card.label}
                        style={[
                            styles.streakCard,
                            { transform: [{ scale: scaleAnim[card.index] }] }
                        ]}
                    >
                        <View style={[
                            styles.streakIcon,
                            { backgroundColor: card.color + '20' }
                        ]}>
                            <IconSymbol
                                name={card.icon}
                                size={24}
                                color={card.color}
                            />
                        </View>
                        <ThemedText style={styles.streakValue}>
                            {card.value}
                        </ThemedText>
                        <ThemedText style={styles.streakLabel}>
                            {card.label}
                        </ThemedText>

                        {/* Achievement Badge */}
                        {((typeof card.value === 'number' && card.value >= card.achievementThreshold) ||
                            (typeof card.value === 'string' && parseInt(card.value) >= card.achievementThreshold)) && (
                                <View style={[
                                    styles.achievementBadge,
                                    card.achievementIcon === 'star.fill' && styles.achievementBadgeStar,
                                    card.achievementIcon === 'crown.fill' && styles.achievementBadgeCrown,
                                    card.achievementIcon === 'checkmark.seal.fill' && styles.achievementBadgeCheckmark,
                                ]}>
                                    <IconSymbol
                                        name={card.achievementIcon}
                                        size={12}
                                        color="white"
                                    />
                                </View>
                            )}
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}



function CategoryBreakdown({ categoryData, totalHabits }: CategoryBreakdownProps) {
    const sortedCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // Show top 8 categories

    const donutAnimValues = useRef(
        sortedCategories.map(() => new Animated.Value(0))
    ).current;
    const scaleAnimValues = useRef(
        sortedCategories.map(() => new Animated.Value(0.9))
    ).current;

    useEffect(() => {
        // Staggered donut animation
        const animations = sortedCategories.map((_, index) => {
            return Animated.parallel([
                Animated.timing(donutAnimValues[index], {
                    toValue: 1,
                    duration: 1000,
                    delay: index * 150,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: false,
                }),
                Animated.spring(scaleAnimValues[index], {
                    toValue: 1,
                    delay: index * 150,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]);
        });

        Animated.stagger(100, animations).start();
    }, [categoryData]);

    const DonutSlice = ({ category, count, index, totalCount }: {
        category: string;
        count: number;
        index: number;
        totalCount: number;
    }) => {
        const config = categoryConfig[category as keyof typeof categoryConfig] ||
            { color: '#666', gradient: ['#666', '#888'], label: category, icon: 'circle' };
        const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
        const size = 100;
        const strokeWidth = 12;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        const animatedStrokeDashoffset = donutAnimValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, circumference * (1 - percentage / 100)],
        });

        return (
            <TouchableOpacity
                style={styles.categoryCard}
                activeOpacity={0.8}
            >
                <Animated.View
                    style={[
                        styles.categoryCardContent,
                        { transform: [{ scale: scaleAnimValues[index] }] }
                    ]}
                >
                    <LinearGradient
                        colors={config.gradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categoryGradientBg}
                    >
                        <View style={styles.categoryIconContainer}>
                            <IconSymbol
                                name={config.icon}
                                size={24}
                                color="white"
                            />
                        </View>

                        <View style={styles.categoryInfo}>
                            <ThemedText style={styles.categoryLabel}>
                                {config.label}
                            </ThemedText>
                            <ThemedText style={styles.categoryValue}>
                                {count} nawyk{count === 1 ? '' : count < 5 ? 'i' : 'ów'}
                            </ThemedText>
                            <ThemedText style={styles.categoryPercentage}>
                                {Math.round(percentage)}%
                            </ThemedText>
                        </View>

                        {/* Mini donut progress */}
                        <View style={styles.miniDonutContainer}>
                            <View
                                style={[
                                    styles.miniDonutBg,
                                    { width: 40, height: 40, borderRadius: 20 }
                                ]}
                            >
                                <Animated.View
                                    style={[
                                        styles.miniDonutProgress,
                                        {
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            borderWidth: 4,
                                            borderColor: 'rgba(255,255,255,0.8)',
                                            transform: [{
                                                rotate: donutAnimValues[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0deg', `${360 * (percentage / 100)}deg`],
                                                })
                                            }]
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.categoryContainer, designTokens.shadows.card]}>
            <View style={styles.chartHeader}>
                <View style={styles.chartTitleContainer}>
                    <IconSymbol name="chart.pie.fill" size={20} color={designTokens.colors.primary.base} />
                    <ThemedText style={styles.chartTitle}>Rozkład kategorii</ThemedText>
                </View>
                <View style={styles.categoryStats}>
                    <ThemedText style={styles.categoryStatsText}>
                        {sortedCategories.length} kategori{sortedCategories.length === 1 ? 'a' : sortedCategories.length < 5 ? 'e' : 'i'}
                    </ThemedText>
                </View>
            </View>

            {sortedCategories.length > 0 ? (
                <View style={styles.categoryGrid}>
                    {sortedCategories.map(([category, count], index) => (
                        <DonutSlice
                            key={category}
                            category={category}
                            count={count}
                            index={index}
                            totalCount={totalHabits}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <IconSymbol name="chart.pie" size={48} color="#ccc" />
                    <ThemedText style={styles.emptyText}>
                        Brak danych do wyświetlenia
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                        Dodaj pierwsze nawyki, aby zobaczyć analizę
                    </ThemedText>
                </View>
            )}
        </View>
    );
}

export function HabitCharts({ habitStats, selectedPeriod, onPeriodChange }: HabitChartsProps) {
    // Handle both direct HabitStats and API response structure
    const stats = (habitStats as any)?.data || habitStats;

    if (!stats || !stats.weeklyProgress || !Array.isArray(stats.weeklyProgress)) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingState}>
                    <IconSymbol name="chart.bar" size={48} color="#ccc" />
                    <ThemedText style={styles.loadingText}>Ładowanie wykresów...</ThemedText>
                </View>
            </View>
        );
    }

    const maxCompletions = Math.max(
        ...stats.weeklyProgress.map((day: any) => day.completions),
        1
    );

    return (
        <View style={styles.container}>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {[
                    { key: 'week' as const, label: 'Tydzień' },
                    { key: 'month' as const, label: 'Miesiąc' },
                    { key: 'year' as const, label: 'Rok' }
                ].map(period => (
                    <TouchableOpacity
                        key={period.key}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period.key && styles.periodButtonActive
                        ]}
                        onPress={() => onPeriodChange(period.key)}
                    >
                        <ThemedText style={[
                            styles.periodButtonText,
                            selectedPeriod === period.key && styles.periodButtonTextActive
                        ]}>
                            {period.label}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Charts */}
            <WeeklyProgressChart
                data={stats.weeklyProgress}
                maxValue={maxCompletions}
            />

            {/* Enterprise Streak Cards */}
            <EnterpriseStreakCards
                currentStreak={stats.currentActiveStreak}
                longestStreak={stats.longestStreak}
                completionRate={stats.averageCompletionRate}
            />

            <StreakVisualization
                currentStreak={stats.currentActiveStreak}
                longestStreak={stats.longestStreak}
                completionRate={stats.averageCompletionRate}
            />

            <CategoryBreakdown
                categoryData={stats.categoryBreakdown}
                totalHabits={stats.totalHabits}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // Main Container
    container: {
        backgroundColor: '#f8fafc',
        paddingVertical: designTokens.spacing.lg,
        gap: designTokens.spacing.lg,
    },

    // Loading States
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        marginHorizontal: designTokens.spacing.md,
        borderRadius: designTokens.borderRadius.xl,
        paddingVertical: designTokens.spacing.xl * 2,
        ...designTokens.shadows.card,
        gap: designTokens.spacing.md,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#64748b',
        textAlign: 'center',
    },

    // Period Selector with Enterprise Styling
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: designTokens.spacing.md,
        backgroundColor: '#f1f5f9',
        borderRadius: designTokens.borderRadius.medium,
        padding: designTokens.spacing.xs,
        ...designTokens.shadows.card,
    },
    periodButton: {
        flex: 1,
        paddingVertical: designTokens.spacing.sm + 4,
        paddingHorizontal: designTokens.spacing.md,
        borderRadius: designTokens.borderRadius.small,
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodButtonActive: {
        backgroundColor: 'white',
        ...designTokens.shadows.card,
        transform: [{ scale: 1.02 }],
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
    },
    periodButtonTextActive: {
        color: designTokens.colors.primary.base,
        fontWeight: '700',
    },

    // Chart Container with Professional Design
    chartContainer: {
        backgroundColor: 'white',
        marginHorizontal: designTokens.spacing.md,
        borderRadius: designTokens.borderRadius.xl,
        padding: designTokens.spacing.lg,
        ...designTokens.shadows.card,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },

    // Chart Header
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: designTokens.spacing.lg,
        paddingBottom: designTokens.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    chartTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: designTokens.spacing.sm,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.02,
    },
    completionSummary: {
        backgroundColor: designTokens.colors.primary.base + '15',
        paddingHorizontal: designTokens.spacing.sm,
        paddingVertical: designTokens.spacing.xs,
        borderRadius: designTokens.borderRadius.small,
    },
    completionText: {
        fontSize: 12,
        fontWeight: '600',
        color: designTokens.colors.primary.base,
    },

    // Chart Content
    chartContent: {
        flexDirection: 'row',
        height: chartHeight + 40,
    },
    yAxisContainer: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: designTokens.spacing.sm,
        height: chartHeight,
        width: 40,
    },
    yAxisLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#64748b',
        textAlign: 'right',
    },
    chartArea: {
        flex: 1,
        position: 'relative',
        height: chartHeight,
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#f1f5f9',
        opacity: 0.8,
    },

    // Enhanced Bar Styling
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: chartHeight,
        paddingTop: designTokens.spacing.sm,
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: chartHeight + 40,
    },
    barWrapper: {
        width: '80%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: designTokens.spacing.sm,
    },
    bar: {
        width: '100%',
        borderRadius: designTokens.borderRadius.small,
        minHeight: 4,
        position: 'relative',
    },
    completionBadge: {
        position: 'absolute',
        top: -24,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        opacity: 0,
    },
    completionBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'white',
    },
    barLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    barValue: {
        fontSize: 10,
        fontWeight: '500',
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 2,
    },

    // Streak Visualization with Circular Progress
    streakContainer: {
        backgroundColor: 'white',
        marginHorizontal: designTokens.spacing.md,
        borderRadius: designTokens.borderRadius.xl,
        padding: designTokens.spacing.lg,
        ...designTokens.shadows.card,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    progressIndicatorsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: designTokens.spacing.lg,
        paddingHorizontal: 4,
    },
    circularProgressContainer: {
        alignItems: 'center',
        gap: designTokens.spacing.sm,
    },
    circularProgressWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circularProgressBg: {
        position: 'absolute',
        borderColor: '#f1f5f9',
    },
    circularProgressForeground: {
        position: 'absolute',
    },
    circularProgressCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    circularProgressValue: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    circularProgressUnit: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
    },
    circularProgressLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        maxWidth: 70,
        lineHeight: 14,
    },

    // Achievement System
    achievementSection: {
        paddingTop: designTokens.spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    achievementTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: designTokens.spacing.sm,
        textAlign: 'center',
    },
    achievementBadges: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: designTokens.spacing.sm,
        flexWrap: 'wrap',
    },
    achievementBadgeActive: {
        backgroundColor: designTokens.colors.warning.base + '15',
        borderColor: designTokens.colors.warning.base + '30',
    },
    achievementText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#94a3b8',
    },
    achievementTextActive: {
        color: designTokens.colors.warning.base,
        fontWeight: '600',
    },

    // Category Breakdown with Cards
    categoryContainer: {
        backgroundColor: 'white',
        marginHorizontal: designTokens.spacing.md,
        borderRadius: designTokens.borderRadius.xl,
        padding: designTokens.spacing.lg,
        ...designTokens.shadows.card,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    categoryStats: {
        backgroundColor: designTokens.colors.primary.base + '10',
        paddingHorizontal: designTokens.spacing.sm,
        paddingVertical: designTokens.spacing.xs,
        borderRadius: designTokens.borderRadius.small,
    },
    categoryStatsText: {
        fontSize: 12,
        fontWeight: '600',
        color: designTokens.colors.primary.base,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: designTokens.spacing.sm,
    },
    categoryCard: {
        flex: 1,
        minWidth: '47%',
        maxWidth: '48%',
    },
    categoryCardContent: {
        borderRadius: designTokens.borderRadius.medium,
        overflow: 'hidden',
        ...designTokens.shadows.card,
    },
    categoryGradientBg: {
        padding: designTokens.spacing.md,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    categoryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    categoryInfo: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 4,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    categoryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    categoryPercentage: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
    },
    miniDonutContainer: {
        position: 'absolute',
        top: designTokens.spacing.md,
        right: designTokens.spacing.md,
    },
    miniDonutBg: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniDonutProgress: {
        position: 'absolute',
        backgroundColor: 'transparent',
    },

    // Empty States
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: designTokens.spacing.xl,
        gap: designTokens.spacing.md,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#64748b',
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Professional Enterprise Streak Card Styles
    streakCard: {
        backgroundColor: 'white',
        borderRadius: designTokens.borderRadius.large,
        padding: designTokens.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        width: '30%',
        position: 'relative',
        ...designTokens.shadows.card,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        transform: [{ scale: 1 }],
    },

    streakIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: designTokens.spacing.sm,
        // Subtle gradient effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    streakValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: designTokens.spacing.xs,
        letterSpacing: -0.5,
        // Professional typography
        textAlign: 'center',
        lineHeight: 32,
    },

    streakLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: designTokens.spacing.xs,
        // Professional spacing
        lineHeight: 16,
    },

    achievementBadge: {
        position: 'absolute',
        top: designTokens.spacing.sm,
        right: designTokens.spacing.sm,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: designTokens.colors.warning.base,
        alignItems: 'center',
        justifyContent: 'center',
        // Professional badge styling
        shadowColor: designTokens.colors.warning.base,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        // Subtle animation ready
        transform: [{ scale: 1 }],
    },

    // Additional enterprise components for streak visualization
    streakCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: designTokens.spacing.md,
        paddingHorizontal: designTokens.spacing.sm,
    },

    streakCardActive: {
        borderColor: designTokens.colors.primary.base,
        borderWidth: 2,
        backgroundColor: designTokens.colors.primary.base + '05',
        transform: [{ scale: 1.02 }],
    },

    streakIconActive: {
        backgroundColor: designTokens.colors.primary.base + '20',
        borderWidth: 2,
        borderColor: designTokens.colors.primary.base + '40',
    },

    // Professional achievement badge variants
    achievementBadgeStar: {
        backgroundColor: '#F59E0B',
        shadowColor: '#F59E0B',
    },

    achievementBadgeCrown: {
        backgroundColor: '#8B5CF6',
        shadowColor: '#8B5CF6',
    },

    achievementBadgeCheckmark: {
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
    },

    // Streak card container with enterprise layout
    streakCardsContainer: {
        backgroundColor: 'white',
        marginHorizontal: designTokens.spacing.md,
        borderRadius: designTokens.borderRadius.xl,
        padding: designTokens.spacing.lg,
        ...designTokens.shadows.card,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
});
