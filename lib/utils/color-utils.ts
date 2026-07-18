/**
 * Color utilities for ensuring proper contrast and handling edge cases
 */

import { Colors } from '@/constants/theme';

/**
 * Ensures we always get a high-contrast color combination
 * This is a failsafe for devices that might have color rendering issues
 */
export function ensureContrastColor(
    colorScheme: 'light' | 'dark',
    colorType: 'text' | 'textSecondary' | 'textTertiary' = 'text'
): string {
    const colors = Colors[colorScheme];
    const color = colors[colorType];

    if (color) {
        return color;
    }

    // Last-resort fallback if the theme itself failed to provide a value
    return colorScheme === 'light' ? '#101319' : '#F3F4F7';
}

/**
 * Debug function to log color values for troubleshooting
 */
export function debugColorScheme(colorScheme: 'light' | 'dark') {
    const colors = Colors[colorScheme];
    console.log(`🎨 Debug ${colorScheme} theme colors:`, {
        text: colors.text,
        textSecondary: colors.textSecondary,
        textTertiary: colors.textTertiary,
        background: colors.background,
        surface: colors.surface,
        platform: require('react-native').Platform.OS,
        timestamp: new Date().toISOString()
    });
}