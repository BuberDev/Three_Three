import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, ViewProps } from 'react-native';

import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ModernViewProps = ViewProps & {
    lightColor?: string;
    darkColor?: string;
    variant?: 'default' | 'surface' | 'surfaceSecondary';
    gradient?: boolean;
    elevation?: 1 | 2 | 3 | 4;
    borderRadius?: keyof typeof DesignSystem.borderRadius;
    padding?: keyof typeof DesignSystem.spacing;
};

export function ModernView({
    style,
    lightColor,
    darkColor,
    variant = 'default',
    gradient = false,
    elevation = 0,
    borderRadius = 'md',
    padding,
    children,
    ...otherProps
}: ModernViewProps) {
    const colorKey = variant === 'surface' ? 'surface' :
        variant === 'surfaceSecondary' ? 'surfaceSecondary' : 'background';
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

    const baseStyle = {
        backgroundColor,
        borderRadius: DesignSystem.borderRadius[borderRadius],
        ...(padding && { padding: DesignSystem.spacing[padding] }),
        ...(elevation > 0 && DesignSystem.elevation[elevation]),
    };

    if (gradient) {
        return (
            <LinearGradient
                colors={DesignSystem.gradients.surface.colors}
                locations={DesignSystem.gradients.surface.locations}
                start={DesignSystem.gradients.surface.start}
                end={DesignSystem.gradients.surface.end}
                style={[baseStyle, style]}
                {...otherProps}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[baseStyle, style]} {...otherProps}>
            {children}
        </View>
    );
}