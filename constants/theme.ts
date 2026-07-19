/**
 * "Night Signal" Design System
 * Ember (day/action) + Tide (night/sleep) duality, WCAG-validated for both themes.
 * See docs/superpowers/specs/2026-07-18-mobile-redesign-foundation-design.md
 */

import { Platform } from 'react-native';

// Ember - day/action accent (tasks, voice notes, AI insights)
const EMBER = '#E8813F';
const EMBER_LIGHT = '#F0985C';
const EMBER_DARK = '#B85419'; // text-safe on light surfaces: 4.9:1 on white

// Tide - night/sleep accent
const TIDE = '#3FB6A8';
const TIDE_LIGHT = '#5FC7BB';
const TIDE_DARK = '#1F7A70'; // text-safe on light surfaces: 5.2:1 on white

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
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  onAccent: string;
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
    text: '#101319', // Ink - dark text for light backgrounds
    textSecondary: '#565D6B',
    textTertiary: '#7A8190',
    background: '#F6F7F9', // Cool paper (not cream) so the ember accent stays deliberate
    backgroundSecondary: '#EEF0F3',
    backgroundTertiary: '#E4E6EA',
    surface: '#FFFFFF',
    surfaceSecondary: '#FFFFFF',
    cardBackground: '#FFFFFF',
    border: '#E4E6EA',
    borderLight: '#EEF0F3',
    tint: EMBER,
    primary: EMBER,
    primaryLight: EMBER_LIGHT,
    primaryDark: EMBER_DARK,
    secondary: TIDE,
    secondaryLight: TIDE_LIGHT,
    secondaryDark: TIDE_DARK,
    onAccent: '#101319', // Dark ink text for use on filled ember/tide surfaces
    gray: '#565D6B',
    shadow: '#000000',
    icon: '#565D6B',
    iconSecondary: '#9AA1AF',
    tabIconDefault: '#565D6B',
    tabIconSelected: EMBER,
    success: '#0A7A54', // Darkened from #0E9F6E — white text on the lighter shade failed 4.5:1 (measured 3.39:1)
    warning: '#A16207', // Yellow-gold, not amber — amber would clash with ember
    error: '#DC2626',
  },
  dark: {
    text: '#F3F4F7',
    textSecondary: '#9AA1AF',
    textTertiary: '#6B7280',
    background: '#0A0D13', // Ink
    backgroundSecondary: '#12161F',
    backgroundTertiary: '#1A2029',
    surface: '#12161F',
    surfaceSecondary: '#1A2029',
    cardBackground: '#12161F',
    border: '#232A35',
    borderLight: '#2A323F',
    tint: EMBER_LIGHT,
    primary: EMBER_LIGHT,
    primaryLight: '#F5B07E',
    primaryDark: EMBER,
    secondary: '#5FC7BB',
    secondaryLight: '#83D3C9',
    secondaryDark: TIDE,
    onAccent: '#0A0D13', // Dark ink text for use on filled ember/tide surfaces
    gray: '#9AA1AF',
    shadow: '#000000',
    icon: '#9AA1AF',
    iconSecondary: '#6B7280',
    tabIconDefault: '#9AA1AF',
    tabIconSelected: EMBER_LIGHT,
    success: '#34D399',
    warning: '#FACC15',
    error: '#F87171',
  },
};

// Global color exports for backward compatibility — Phase-2 screens not yet
// migrated off these still inherit the new brand palette immediately (light-only
// until their own retoning pass).
(Colors as any).primary = EMBER;
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
      colors: [EMBER, EMBER_LIGHT],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    primaryVertical: {
      colors: [EMBER, EMBER_DARK],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    surface: {
      colors: ['rgba(232, 129, 63, 0.03)', 'rgba(232, 129, 63, 0.01)'],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  // Light-mode elevation system (dark mode uses getElevation() below instead —
  // shadows don't read against a near-black background)
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

/**
 * Dark-mode-safe elevation. Shadows with shadowColor:'#000' don't read against
 * a near-black background, so dark mode substitutes a 1px hairline border for
 * the shadow instead of just dimming it. Light mode keeps the existing shadow
 * recipe unchanged. Additive alongside DesignSystem.elevation (not a replacement)
 * so Phase-2 screens that still spread DesignSystem.elevation[N] directly keep
 * compiling and behaving exactly as before.
 */
export function getElevation(scheme: 'light' | 'dark', level: 1 | 2 | 3 | 4) {
  if (scheme === 'dark') {
    return {
      shadowOpacity: 0,
      elevation: 0,
      borderWidth: 1,
      borderColor: Colors.dark.borderLight,
    };
  }
  return DesignSystem.elevation[level];
}
