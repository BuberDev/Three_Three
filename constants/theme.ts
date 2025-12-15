/**
 * Ultra-modern Design System - Premium minimalist theme
 * Single color palette with gradients for professional, cutting-edge UI
 */

import { Platform } from 'react-native';

// Primary purple-based system - single color approach
const PRIMARY = '#6366F1'; // Indigo-500
const PRIMARY_LIGHT = '#8B5CF6'; // Purple-500 
const PRIMARY_DARK = '#4F46E5'; // Indigo-600

interface ColorTheme {
  text: string;
  textSecondary: string;
  textTertiary: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;
  cardBackground: string;
  border: string;
  borderLight: string;
  tint: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  gray: string;
  shadow: string;
  icon: string;
  iconSecondary: string;
  tabIconDefault: string;
  tabIconSelected: string;
  success: string;
  warning: string;
  error: string;
}

interface ColorsType {
  light: ColorTheme;
  dark: ColorTheme;
  primary?: string;
  gray?: string;
  text?: string;
  background?: string;
  surface?: string;
  shadow?: string;
  cardBackground?: string;
}

export const Colors: ColorsType = {
  light: {
    text: '#0F172A', // Slate-900
    textSecondary: '#475569', // Slate-600
    textTertiary: '#94A3B8', // Slate-400
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC', // Slate-50
    backgroundTertiary: '#F1F5F9', // Slate-100
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    cardBackground: '#FFFFFF', // Card background color
    border: '#E2E8F0', // Slate-200
    borderLight: '#F1F5F9', // Slate-100
    tint: PRIMARY,
    primary: PRIMARY,
    primaryLight: PRIMARY_LIGHT,
    primaryDark: PRIMARY_DARK,
    gray: '#94A3B8', // Slate-400
    shadow: '#000000', // Shadow color
    icon: '#64748B', // Slate-500
    iconSecondary: '#94A3B8', // Slate-400
    tabIconDefault: '#94A3B8',
    tabIconSelected: PRIMARY,
    success: '#10B981', // Emerald-500
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500
  },
  dark: {
    text: '#F8FAFC', // Slate-50
    textSecondary: '#CBD5E1', // Slate-300
    textTertiary: '#64748B', // Slate-500
    background: '#0F172A', // Slate-900
    backgroundSecondary: '#1E293B', // Slate-800
    backgroundTertiary: '#334155', // Slate-700
    surface: '#1E293B', // Slate-800
    surfaceSecondary: '#334155', // Slate-700
    cardBackground: '#1E293B', // Card background color
    border: '#334155', // Slate-700
    borderLight: '#475569', // Slate-600
    tint: PRIMARY_LIGHT,
    primary: PRIMARY_LIGHT,
    primaryLight: '#A855F7', // Purple-400
    primaryDark: PRIMARY,
    gray: '#64748B', // Slate-500
    shadow: '#000000', // Shadow color
    icon: '#94A3B8', // Slate-400
    iconSecondary: '#64748B', // Slate-500
    tabIconDefault: '#64748B',
    tabIconSelected: PRIMARY_LIGHT,
    success: '#34D399', // Emerald-400
    warning: '#FBBF24', // Amber-400
    error: '#F87171', // Red-400
  },
};

// Global color exports for backward compatibility
(Colors as any).primary = PRIMARY;
(Colors as any).gray = Colors.light.gray;
(Colors as any).text = Colors.light.text;
(Colors as any).background = Colors.light.background;
(Colors as any).surface = Colors.light.surface;
(Colors as any).shadow = Colors.light.shadow;
(Colors as any).cardBackground = Colors.light.cardBackground;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Professional Design System with Modern Gradients
export const DesignSystem = {
  // Primary gradient system
  gradients: {
    primary: {
      colors: [PRIMARY, PRIMARY_LIGHT],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    primaryVertical: {
      colors: [PRIMARY, PRIMARY_DARK],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    surface: {
      colors: ['rgba(99, 102, 241, 0.03)', 'rgba(99, 102, 241, 0.01)'],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  // Modern elevation system
  elevation: {
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  // Ultra-modern border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  // Perfect spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  // Modern typography with perfect line heights
  typography: {
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '700',
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '700',
      letterSpacing: 0,
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '600',
      letterSpacing: 0,
    },
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '600',
      letterSpacing: 0,
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '600',
      letterSpacing: 0,
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      letterSpacing: 0,
    },
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600',
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.4,
    },
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  },
};
