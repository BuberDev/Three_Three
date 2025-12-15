import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { DimensionValue, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';

import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';

export type ModernButtonProps = TouchableOpacityProps & {
    title: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
};

export function ModernButton({
    title,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    onPress,
    style,
    disabled,
    ...props
}: ModernButtonProps) {
    const primaryColor = useThemeColor({}, 'primary');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');

    const sizeStyles = {
        small: {
            paddingHorizontal: DesignSystem.spacing.md,
            paddingVertical: DesignSystem.spacing.sm,
            minHeight: 36,
        },
        medium: {
            paddingHorizontal: DesignSystem.spacing.xl,
            paddingVertical: DesignSystem.spacing.md,
            minHeight: 44,
        },
        large: {
            paddingHorizontal: DesignSystem.spacing['2xl'],
            paddingVertical: DesignSystem.spacing.lg,
            minHeight: 52,
        },
    };

    const textVariants = {
        small: 'labelMedium' as const,
        medium: 'labelLarge' as const,
        large: 'titleSmall' as const,
    };

    const handlePress = (event: any) => {
        if (!disabled && onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress(event);
        }
    };

    const baseStyle: ViewStyle = {
        borderRadius: DesignSystem.borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...sizeStyles[size],
        ...(fullWidth && { width: '100%' as DimensionValue }),
        opacity: disabled || loading ? 0.6 : 1,
        ...DesignSystem.elevation[1],
    };

    if (variant === 'primary') {
        const primaryColor = useThemeColor({}, 'primary');
        const primaryLight = useThemeColor({}, 'primaryLight');

        return (
            <TouchableOpacity
                onPress={handlePress}
                disabled={disabled || loading}
                style={[style]}
                {...props}
            >
                <LinearGradient
                    colors={[primaryColor, primaryLight] as readonly [string, string, ...string[]]}
                    locations={[0, 1] as readonly [number, number, ...number[]]}
                    start={DesignSystem.gradients.primary.start}
                    end={DesignSystem.gradients.primary.end}
                    style={baseStyle}
                >
                    {leftIcon && <View style={{ marginRight: DesignSystem.spacing.sm }}>{leftIcon}</View>}
                    <ThemedText
                        variant={textVariants[size]}
                        lightColor="white"
                        darkColor="white"
                        style={{ fontWeight: '600' }}
                    >
                        {title}
                    </ThemedText>
                    {rightIcon && <View style={{ marginLeft: DesignSystem.spacing.sm }}>{rightIcon}</View>}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                onPress={handlePress}
                disabled={disabled || loading}
                style={[
                    baseStyle,
                    {
                        backgroundColor: surfaceColor,
                        borderWidth: 1,
                        borderColor: borderColor,
                    },
                    style
                ]}
                {...props}
            >
                {leftIcon && <View style={{ marginRight: DesignSystem.spacing.sm }}>{leftIcon}</View>}
                <ThemedText
                    variant={textVariants[size]}
                    style={{ fontWeight: '600' }}
                >
                    {title}
                </ThemedText>
                {rightIcon && <View style={{ marginLeft: DesignSystem.spacing.sm }}>{rightIcon}</View>}
            </TouchableOpacity>
        );
    }

    // Ghost variant
    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled || loading}
            style={[
                baseStyle,
                {
                    backgroundColor: 'transparent',
                    ...(DesignSystem.elevation[1] || {}),
                },
                style
            ]}
            {...props}
        >
            {leftIcon && <View style={{ marginRight: DesignSystem.spacing.sm }}>{leftIcon}</View>}
            <ThemedText
                variant={textVariants[size]}
                lightColor={primaryColor}
                darkColor={primaryColor}
                style={{ fontWeight: '600' }}
            >
                {title}
            </ThemedText>
            {rightIcon && <View style={{ marginLeft: DesignSystem.spacing.sm }}>{rightIcon}</View>}
        </TouchableOpacity>
    );
}