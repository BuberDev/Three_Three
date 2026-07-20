import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    DimensionValue,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';

import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
    const colorScheme = useColorScheme();
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const surfaceColor = useThemeColor({}, 'surface');
    const disabledSurfaceColor = useThemeColor({}, 'backgroundTertiary');
    const borderColor = useThemeColor({}, 'border');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const onAccentColor = useThemeColor({}, 'onAccent');

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
            ReactNativeHapticFeedback.trigger('impactLight');
            onPress(event);
        }
    };

    const baseStyle: ViewStyle = {
        borderRadius: DesignSystem.borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        ...sizeStyles[size],
        ...(fullWidth && { width: '100%' as DimensionValue }),
        opacity: loading ? 0.85 : 1,
        ...getElevation(colorScheme, 1),
    };

    if (variant === 'primary') {
        const isDisabled = disabled || loading;
        const contentColor = isDisabled ? textSecondaryColor : onAccentColor;
        const gradientColors = isDisabled
            ? [disabledSurfaceColor, disabledSurfaceColor]
            : [primaryColor, primaryLight];

        return (
            <TouchableOpacity
                onPress={handlePress}
                disabled={disabled || loading}
                activeOpacity={0.85}
                style={[
                    fullWidth && { width: '100%' },
                    style,
                ]}
                {...props}
            >
                <LinearGradient
                    colors={gradientColors}
                    locations={[0, 1]}
                    start={DesignSystem.gradients.primary.start}
                    end={DesignSystem.gradients.primary.end}
                    style={[
                        baseStyle,
                        { alignSelf: 'stretch', width: '100%' },
                        isDisabled ? {
                            borderWidth: 1,
                            borderColor,
                            shadowOpacity: 0,
                            elevation: 0,
                        } : null,
                    ]}
                >
                    {leftIcon && <View style={{ marginRight: DesignSystem.spacing.sm }}>{leftIcon}</View>}
                    {loading && (
                        <ActivityIndicator
                            size="small"
                            color={contentColor}
                            style={{ marginRight: DesignSystem.spacing.sm }}
                        />
                    )}
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                        style={{
                            flexShrink: 1,
                            minWidth: 0,
                            color: contentColor,
                            fontSize: size === 'large' ? 16 : size === 'medium' ? 15 : 14,
                            lineHeight: size === 'large' ? 22 : 20,
                            fontWeight: '700',
                            textAlign: 'center',
                            includeFontPadding: false,
                        }}
                    >
                        {title}
                    </Text>
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ flexShrink: 1, minWidth: 0, fontWeight: '600' }}
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
                    ...getElevation(colorScheme, 1),
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
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ flexShrink: 1, minWidth: 0, fontWeight: '600' }}
            >
                {title}
            </ThemedText>
            {rightIcon && <View style={{ marginLeft: DesignSystem.spacing.sm }}>{rightIcon}</View>}
        </TouchableOpacity>
    );
}
