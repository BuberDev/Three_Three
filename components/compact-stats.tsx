import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

interface CompactStatsProps {
    readonly title: string;
    readonly count: number;
    readonly icon: any; // Accept any type to support both string and icon types
    readonly isActive?: boolean;
    readonly onPress?: () => void;
    readonly showPreview?: boolean;
    readonly previewItems?: Array<{ id: string; title: string; completed?: boolean }>;
}

export function CompactStats({
    title,
    count,
    icon,
    isActive = false,
    onPress,
    showPreview = false,
    previewItems = []
}: CompactStatsProps) {
    const surfaceColor = useThemeColor({}, 'surface');
    const primaryColor = useThemeColor({}, 'primary');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const borderColor = useThemeColor({}, 'border');
    const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
    const backgroundTertiary = useThemeColor({}, 'backgroundTertiary');
    const successColor = useThemeColor({}, 'success');

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: surfaceColor, borderColor },
                isActive && { borderColor: primaryColor, borderWidth: 2 }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header with icon and count */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: backgroundSecondary }]}>
                    <IconSymbol
                        name={icon}
                        size={16}
                        color={isActive ? primaryColor : textSecondary}
                    />
                </View>
                <View style={[styles.countBadge, { backgroundColor: backgroundTertiary }]}>
                    <ThemedText
                        variant="bodyMedium"
                        style={[styles.count, { color: isActive ? primaryColor : textColor }]}
                    >
                        {count}
                    </ThemedText>
                </View>
            </View>

            {/* Title */}
            <ThemedText
                variant="bodySmall"
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[styles.title, { color: isActive ? primaryColor : textSecondary }]}
            >
                {title}
            </ThemedText>

            {/* Preview Items */}
            {showPreview && previewItems.length > 0 && (
                <View style={styles.previewContainer}>
                    {previewItems.slice(0, 2).map((item, index) => (
                        <View key={item.id} style={styles.previewItem}>
                            <View style={[
                                styles.previewDot,
                                { backgroundColor: item.completed ? successColor : textSecondary }
                            ]} />
                            <ThemedText
                                variant="bodySmall"
                                style={[
                                    styles.previewText,
                                    { color: textSecondary },
                                    item.completed && styles.completedText
                                ]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </ThemedText>
                        </View>
                    ))}
                    {previewItems.length > 2 && (
                        <ThemedText variant="bodySmall" style={[styles.moreText, { color: textSecondary }]}>
                            +{previewItems.length - 2} więcej
                        </ThemedText>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 110,
        maxHeight: 110,
        padding: DesignSystem.spacing.sm,
        borderRadius: DesignSystem.borderRadius.md,
        borderWidth: 1,
        ...DesignSystem.elevation[1],
        overflow: 'hidden',
        minWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: DesignSystem.spacing.xs,
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadge: {
        minWidth: 24,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: DesignSystem.spacing.xs,
    },
    count: {
        fontWeight: '600',
        fontSize: 12,
    },
    title: {
        fontWeight: '500',
        marginBottom: 2,
        fontSize: 11,
        lineHeight: 14,
        minHeight: 28,
    },
    previewContainer: {
        flex: 1,
        gap: 1,
        maxHeight: 45,
        overflow: 'hidden',
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSystem.spacing.xs / 2,
    },
    previewDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    previewText: {
        flex: 1,
        fontSize: 9,
        lineHeight: 11,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    moreText: {
        fontSize: 10,
        fontStyle: 'italic',
        marginTop: 2,
    },
});
