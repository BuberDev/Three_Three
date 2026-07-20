import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import { View } from 'react-native';

import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';

export type ModernCardProps = {
    children?: React.ReactNode;
    title?: string;
    subtitle?: string;
    gradient?: boolean;
    elevation?: 1 | 2 | 3 | 4;
    padding?: keyof typeof DesignSystem.spacing;
    borderRadius?: keyof typeof DesignSystem.borderRadius;
    style?: any;
};

export function ModernCard({
    children,
    title,
    subtitle,
    gradient = false,
    elevation = 2,
    padding = 'lg',
    borderRadius = 'lg',
    style,
}: ModernCardProps) {
    const colorScheme = useColorScheme();
    const surfaceColor = useThemeColor({}, 'surface');
    const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

    const baseStyle = {
        borderRadius: DesignSystem.borderRadius[borderRadius],
        padding: DesignSystem.spacing[padding],
        ...getElevation(colorScheme, elevation),
    };

    const content = (
        <>
            {(title || subtitle) && (
                <View style={{ marginBottom: title && subtitle ? DesignSystem.spacing.md : DesignSystem.spacing.sm }}>
                    {title && (
                        <ThemedText
                            variant="titleLarge"
                            style={{ marginBottom: subtitle ? DesignSystem.spacing.xs : 0 }}
                        >
                            {title}
                        </ThemedText>
                    )}
                    {subtitle && (
                        <ThemedText variant="bodyMedium" color="secondary">
                            {subtitle}
                        </ThemedText>
                    )}
                </View>
            )}
            {children}
        </>
    );

    if (gradient) {
        return (
            <LinearGradient
                colors={[surfaceColor, surfaceSecondary] as [string, string]}
                locations={[0, 1] as [number, number]}
                start={DesignSystem.gradients.surface.start}
                end={DesignSystem.gradients.surface.end}
                style={[baseStyle, style]}
            >
                {content}
            </LinearGradient>
        );
    }

    return (
        <View style={[{ backgroundColor: surfaceColor }, baseStyle, style]}>
            {content}
        </View>
    );
}
