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

    // Failsafe: If for any reason we get a light color on light background
    // or dark color on dark background, force high contrast
    if (colorScheme === 'light') {
        // Ensure we have a dark text color for light backgrounds
        if (colorType === 'text') return '#0F172A'; // Force dark slate-900
        if (colorType === 'textSecondary') return '#374151'; // Force dark gray-700
        if (colorType === 'textTertiary') return '#4B5563'; // Force dark gray-600
    } else {
        // Ensure we have a light text color for dark backgrounds
        if (colorType === 'text') return '#F8FAFC'; // Force light slate-50
        if (colorType === 'textSecondary') return '#CBD5E1'; // Force light slate-300
        if (colorType === 'textTertiary') return '#94A3B8'; // Force light slate-400
    }

    return color;
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