# Mobile Redesign Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the "Night Signal" design system (WCAG-validated ember/tide color tokens, dark-mode-correct elevation, consolidated icon family) across the app's shared theme plumbing, navigation chrome, and two flagship screens (Home, Profile), plus a manual System/Light/Dark theme toggle — per `docs/superpowers/specs/2026-07-18-mobile-redesign-foundation-design.md`.

**Architecture:** `constants/theme.ts` remains the single source of truth for color/spacing/typography tokens; a new `getElevation(scheme, level)` helper is added alongside (not replacing) the existing static `DesignSystem.elevation` object so Phase-2 screens keep compiling unchanged. Theme resolution flows: `stores/app-store.ts` (`themePreference`, persisted) → `hooks/use-color-scheme.ts` (resolves system vs. override) → `hooks/use-theme-color.ts` / direct `Colors[scheme]` reads in components.

**Tech Stack:** Expo/React Native 0.81, React Navigation (bottom-tabs + native-stack), zustand + persist (AsyncStorage), `react-native-linear-gradient`, `react-native-vector-icons` (switching `IconSymbol` from `MaterialIcons` to `MaterialCommunityIcons`, already bundled — no new dependency). No unit test runner exists in this repo (confirmed: no `jest` in `package.json`, no test scripts) — verification is `npx tsc --noEmit`, `npm run lint`, and manual visual checks per task.

## Global Constraints
- No new npm dependencies — every visual change uses libraries already in `package.json`.
- Every accent/text color pairing must meet WCAG AA (4.5:1 body/label text, 3:1 large text ≥18.66px-bold or non-text UI graphics) — exact values are given per task, do not substitute similar-looking hex values.
- Filled ember/tide buttons use dark ink text (`onAccent` token), never white — verified in the design spec that white text fails contrast on these accent shades.
- Do not touch any file outside the Foundation scope listed in the design spec (AI/Routines/Sleep/Voice tabs, onboarding, payments, the other two subscription UIs, dead files) — those are explicitly Phase 2.
- Icon family: `components/ui/icon-symbol.tsx` switches its rendering engine from `MaterialIcons` to `MaterialCommunityIcons` (both bundled in `react-native-vector-icons`, already a dependency). This is a shared, app-wide component, so **every existing mapping key must get a valid replacement**, not just the ones used on flagship screens — otherwise Phase-2 screens regress to blank icons. All target glyph names below were verified to exist in `node_modules/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json` before writing this plan.

---

### Task 1: Fix the contrast failsafe bug in `lib/utils/color-utils.ts`

**Files:**
- Modify: `lib/utils/color-utils.ts`

**Interfaces:**
- Produces: `ensureContrastColor(colorScheme: 'light'|'dark', colorType?: 'text'|'textSecondary'|'textTertiary'): string` — same signature as before, callers (`hooks/use-theme-color.ts`) are unchanged.

**Why this is first:** `useThemeColor` (`hooks/use-theme-color.ts:23-25`) unconditionally routes `text`/`textSecondary`/`textTertiary` lookups through `ensureContrastColor`, which currently **always** returns hardcoded slate values (`#0F172A` etc.) regardless of what `constants/theme.ts` defines. This means every text-color change in Task 2 would be silently ignored until this is fixed.

- [ ] **Step 1: Replace the function body**

In `lib/utils/color-utils.ts`, replace the entire `ensureContrastColor` function with:

```ts
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
```

This makes the theme file the actual source of truth (`color` is returned as-is instead of always being overridden), while keeping a genuine failsafe for the pathological case where `Colors[scheme][colorType]` is empty.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by this file.

- [ ] **Step 3: Commit**

```bash
git add lib/utils/color-utils.ts
git commit -m "fix: stop ensureContrastColor from overriding theme text colors"
```

---

### Task 2: Replace `constants/theme.ts` with the Night Signal token system

**Files:**
- Modify: `constants/theme.ts`

**Interfaces:**
- Produces: `Colors.light`/`Colors.dark` (extended `ColorTheme` with new `secondary`/`secondaryLight`/`secondaryDark`/`onAccent` fields), `DesignSystem` (unchanged shape, ember-derived gradient colors), new `getElevation(scheme: 'light'|'dark', level: 1|2|3|4)` export.
- Consumes: nothing new.

- [ ] **Step 1: Replace the full file**

Replace the entire contents of `constants/theme.ts` with:

```ts
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
    text: '#101319',
    textSecondary: '#565D6B',
    textTertiary: '#7A8190',
    background: '#F6F7F9',
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
    onAccent: '#101319',
    gray: '#565D6B',
    shadow: '#000000',
    icon: '#565D6B',
    iconSecondary: '#9AA1AF',
    tabIconDefault: '#565D6B',
    tabIconSelected: EMBER,
    success: '#0E9F6E',
    warning: '#A16207',
    error: '#DC2626',
  },
  dark: {
    text: '#F3F4F7',
    textSecondary: '#9AA1AF',
    textTertiary: '#6B7280',
    background: '#0A0D13',
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
    onAccent: '#0A0D13',
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
    displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '700', letterSpacing: -0.25 },
    displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '700', letterSpacing: 0 },
    displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '600', letterSpacing: 0 },
    headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '600', letterSpacing: 0 },
    headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600', letterSpacing: 0 },
    headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: 0 },
    titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: 0 },
    titleMedium: { fontSize: 18, lineHeight: 24, fontWeight: '500', letterSpacing: 0.15 },
    titleSmall: { fontSize: 16, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.15 },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25 },
    bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.4 },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
    labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5 },
    labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5 },
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new type errors. (Pre-existing errors unrelated to this file, if any, are out of scope.)

- [ ] **Step 3: Commit**

```bash
git add constants/theme.ts
git commit -m "feat: replace theme tokens with Night Signal palette and add dark-mode elevation helper"
```

---

### Task 3: Add `themePreference` to the app store

**Files:**
- Modify: `stores/app-store.ts`

**Interfaces:**
- Produces: `useAppStore().themePreference: 'system'|'light'|'dark'`, `useAppStore().setThemePreference(pref)`.
- Consumes: existing `persist`/`createJSONStorage` setup already in the file (lines ~150-151, ~2404-2411).

- [ ] **Step 1: Add to the `AppStore` interface**

In `stores/app-store.ts`, find the `// UI state` block (around line 70-73):

```ts
    // UI state
    isLoading: boolean;
    error: string | null;
    isOnboarding: boolean;
```

Change to:

```ts
    // UI state
    isLoading: boolean;
    error: string | null;
    isOnboarding: boolean;
    themePreference: 'system' | 'light' | 'dark';
```

- [ ] **Step 2: Add the setter to the actions section of the interface**

Find (around line 139-144):

```ts
    // General actions
    initialize: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    setOnboardingComplete: () => void;
```

Change to:

```ts
    // General actions
    initialize: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    setOnboardingComplete: () => void;
    setThemePreference: (preference: 'system' | 'light' | 'dark') => void;
```

- [ ] **Step 3: Add initial state**

Find (around line 187-189):

```ts
            isLoading: false,
            error: null,
            isOnboarding: true,
```

Change to:

```ts
            isLoading: false,
            error: null,
            isOnboarding: true,
            themePreference: 'system',
```

- [ ] **Step 4: Add the action implementation**

Find `setOnboardingComplete` in the actions body (search for `setOnboardingComplete: () =>`) and add the new action directly after it:

```ts
            setThemePreference: (themePreference) => set({ themePreference }),
```

- [ ] **Step 5: Persist it**

Find the `partialize` block at the bottom of the file:

```ts
            partialize: (state) => ({
                user: state.user,
                userSettings: state.userSettings,
                isAuthenticated: state.isAuthenticated,
                isOnboarding: state.isOnboarding,
            }),
```

Change to:

```ts
            partialize: (state) => ({
                user: state.user,
                userSettings: state.userSettings,
                isAuthenticated: state.isAuthenticated,
                isOnboarding: state.isOnboarding,
                themePreference: state.themePreference,
            }),
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add stores/app-store.ts
git commit -m "feat: add persisted themePreference to app store"
```

---

### Task 4: Wire manual theme override into `useColorScheme`

**Files:**
- Modify: `hooks/use-color-scheme.ts`
- Modify: `hooks/use-color-scheme.web.ts`

**Interfaces:**
- Consumes: `useAppStore().themePreference` (Task 3).
- Produces: `useColorScheme(): 'light' | 'dark'` — same return type/shape every existing caller already expects.

- [ ] **Step 1: Replace `hooks/use-color-scheme.ts`**

```ts
import { useAppStore } from '@/stores/app-store';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Resolves the effective color scheme: an explicit user override
 * (themePreference) takes priority, otherwise falls back to the OS setting.
 */
export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme();
  const themePreference = useAppStore((state) => state.themePreference);

  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }

  return systemColorScheme === 'dark' ? 'dark' : 'light';
}
```

This also removes the unconditional `console.log` calls that fired on every render/scheme-change, and the redundant `useState`/`useEffect` pair — RN's `useColorScheme()` already triggers a re-render on system changes, so there was no need to mirror it into local state.

- [ ] **Step 2: Replace `hooks/use-color-scheme.web.ts`**

```ts
import { useAppStore } from '@/stores/app-store';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useRNColorScheme();
  const themePreference = useAppStore((state) => state.themePreference);

  if (!hasHydrated) {
    return 'light';
  }

  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }

  return systemColorScheme === 'dark' ? 'dark' : 'light';
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (Every existing caller treats the return value as `'light'|'dark'` already, so no downstream changes needed.)

- [ ] **Step 4: Commit**

```bash
git add hooks/use-color-scheme.ts hooks/use-color-scheme.web.ts
git commit -m "feat: resolve color scheme from manual themePreference before falling back to OS"
```

---

### Task 5: Strip debug logging from `use-theme-color.ts` and `themed-text.tsx`

**Files:**
- Modify: `hooks/use-theme-color.ts`
- Modify: `components/themed-text.tsx`

**Interfaces:**
- No signature changes — `useThemeColor(props, colorName)` and `<ThemedText>` behave identically, minus console spam.

- [ ] **Step 1: Remove the debug block in `hooks/use-theme-color.ts`**

Delete this block (currently lines 27-36):

```ts
    // Debug logging to help identify color resolution issues
    if (__DEV__ && (colorName === 'text' || colorName === 'textSecondary' || colorName === 'textTertiary')) {
      console.log('🎨 useThemeColor (text):', {
        theme,
        colorName,
        resolvedColor,
        finalColor,
        propsProvided: !!colorFromProps
      });
    }

```

so the function body reads:

```ts
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme(); // Now always returns 'light' or 'dark', never null
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const resolvedColor = Colors[theme][colorName];

    const finalColor = (colorName === 'text' || colorName === 'textSecondary' || colorName === 'textTertiary')
      ? ensureContrastColor(theme, colorName as 'text' | 'textSecondary' | 'textTertiary')
      : resolvedColor;

    return finalColor;
  }
}
```

- [ ] **Step 2: Remove the debug block in `components/themed-text.tsx`**

Delete this block (currently lines 29-38):

```ts
  // Debug logging for troubleshooting
  if (__DEV__) {
    console.log('🎨 ThemedText rendering:', {
      variant,
      color,
      colorKey,
      resolvedColor: textColor,
      hasCustomColors: !!lightColor || !!darkColor
    });
  }

```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/use-theme-color.ts components/themed-text.tsx
git commit -m "chore: remove dev console logging from theme color resolution"
```

---

### Task 6: Fix Android haptics gap in `HapticTab`

**Files:**
- Modify: `components/haptic-tab.tsx`

- [ ] **Step 1: Remove the iOS-only guard**

Replace the full file with:

```tsx
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Soft haptic feedback when pressing down on the tabs — matches
        // ModernButton, which already haptics on both platforms.
        ReactNativeHapticFeedback.trigger('impactLight');
        props.onPressIn?.(ev);
      }}
    />
  );
}
```

(Drops the now-unused `Platform` import along with the `Platform.OS === 'ios'` check.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/haptic-tab.tsx
git commit -m "fix: enable tab-press haptics on Android, matching ModernButton"
```

---

### Task 7: Switch `IconSymbol` to MaterialCommunityIcons with a complete mapping

**Files:**
- Modify: `components/ui/icon-symbol.tsx`

**Interfaces:**
- Produces: `<IconSymbol name={string} size?={number} color={string} style?={StyleProp<TextStyle>} />` — same public API, every existing call site across the whole app is unaffected.

**Why every key matters:** `IconSymbol` is shared app-wide. Every glyph name below was verified against `node_modules/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json` before writing this task — do not invent names without checking that file, a typo here silently renders a blank icon on a live screen.

- [ ] **Step 1: Replace the full file**

```tsx
// Icon component using MaterialCommunityIcons (react-native-vector-icons) on all platforms.
// Outline-first glyph choices to match the "Night Signal" calm/precise aesthetic —
// filled variants are used only where a filled glyph carries real meaning
// (achieved/active/premium states).

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, string>;
type IconSymbolName = string;

/**
 * Add your SF Symbols to Material Community Icons mappings here.
 * - see Material Community Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'paperplane.fill': 'send-outline',
  'chevron.left.forwardslash.chevron.right': 'code-tags',
  'chevron.right': 'chevron-right',
  'mic': 'microphone-outline',
  'mic.fill': 'microphone',
  'mic.slash': 'microphone-off',
  'moon': 'weather-night',
  'moon.fill': 'weather-night',
  'moon.zzz': 'power-sleep',
  'list.bullet': 'format-list-bulleted',
  'list.bullet.clipboard': 'clipboard-list-outline',
  'brain': 'brain',
  'person.circle': 'account-circle-outline',
  'person.fill': 'account',
  'chart.bar': 'chart-bar',
  'chart.bar.fill': 'chart-bar',
  'chart.bar.xaxis': 'chart-bar',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'chart.pie': 'chart-pie',
  'chart.pie.fill': 'chart-pie',
  'message.circle.fill': 'message-text-outline',
  'plus': 'plus',
  'plus.circle.fill': 'plus-circle',
  'waveform': 'waveform',
  'waveform.circle.fill': 'waveform',
  'square.and.pencil': 'square-edit-outline',
  'pencil': 'pencil-outline',
  'creditcard.fill': 'credit-card',
  'creditcard': 'credit-card-outline',
  'arrow.left': 'arrow-left',
  'ellipsis.horizontal': 'dots-horizontal',
  'chatbubble': 'chat-outline',
  'folder': 'folder-outline',
  'analytics': 'chart-bell-curve',
  'code': 'code-tags',
  'airplane': 'airplane',
  'app.badge': 'bell-badge-outline',
  'battery.100': 'battery-high',
  'bell.fill': 'bell',
  'bolt.fill': 'lightning-bolt',
  'briefcase.fill': 'briefcase-outline',
  'calendar': 'calendar-blank-outline',
  'calendar.badge.plus': 'calendar-plus',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle-outline',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'check-decagram',
  'clock': 'clock-outline',
  'cloud': 'cloud-outline',
  'crown.fill': 'crown',
  'exclamationmark.triangle': 'alert-outline',
  'figure.run': 'run',
  'flame.fill': 'fire',
  'flask': 'flask-outline',
  'heart.fill': 'heart',
  'hourglass': 'timer-sand',
  'info.circle': 'information-outline',
  'lightbulb': 'lightbulb-outline',
  'location': 'map-marker-outline',
  'star': 'star-outline',
  'star.fill': 'star',
  'sun.haze.fill': 'weather-hazy',
  'sun.max.fill': 'white-balance-sunny',
  'sunrise': 'weather-sunset-up',
  'target': 'target',
  'trash': 'trash-can-outline',
  'trophy': 'trophy-outline',
  'trophy.fill': 'trophy',
  'wand.and.stars': 'creation',
  'xmark': 'close',
  // Added for Profile / Home / TaskList (previously missing — silently fell
  // through to a raw, non-existent MaterialIcons lookup):
  'doc.text.fill': 'file-document-outline',
  'doc.text': 'file-document-outline',
  'shield': 'shield-outline',
  'questionmark.circle': 'help-circle-outline',
  'rectangle.portrait.and.arrow.right': 'logout',
  'circle': 'circle-outline',
  'arrow.up': 'arrow-up-bold',
  'arrow.down': 'arrow-down-bold',
  'minus': 'minus',
  'checklist': 'checkbox-marked-circle-outline',
  'circle.lefthalf.filled': 'theme-light-dark',
};

/**
 * An icon component that renders Material Community Icons on every platform,
 * mapped from SF Symbols names.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  return <MaterialCommunityIcons color={color as string} size={size} name={MAPPING[name] ?? name} style={style} />;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual glyph spot-check**

Run the app (`npm run ios` or `npm run android`) and visually confirm the tab bar (all 6 icons render, none blank) and the Profile screen menu icons (Task 16) render correctly — MAPPING typos are otherwise invisible to typecheck/lint.

- [ ] **Step 4: Commit**

```bash
git add components/ui/icon-symbol.tsx
git commit -m "feat: switch IconSymbol to MaterialCommunityIcons with full outline-first mapping"
```

---

### Task 8: Dark-mode-aware elevation in `TabNavigator`

**Files:**
- Modify: `navigation/TabNavigator.tsx`

- [ ] **Step 1: Import `getElevation` and use it**

Change the import line:

```ts
import { Colors, DesignSystem } from '@/constants/theme';
```

to:

```ts
import { Colors, DesignSystem, getElevation } from '@/constants/theme';
```

Then in the `tabBarStyle` object, replace:

```ts
          ...DesignSystem.elevation[3],
          borderTopLeftRadius: DesignSystem.borderRadius.xl,
          borderTopRightRadius: DesignSystem.borderRadius.xl,
```

with:

```ts
          ...getElevation(colorScheme ?? 'light', 3),
          borderTopLeftRadius: DesignSystem.borderRadius.lg,
          borderTopRightRadius: DesignSystem.borderRadius.lg,
```

(Radius comes down from `xl` (20) to `lg` (16) per the spec's tightened default — reserves the larger radii for hero/feature cards only.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add navigation/TabNavigator.tsx
git commit -m "fix: dark-mode-safe tab bar elevation and tightened radius"
```

---

### Task 9: `ModernButton` — text-safe accent colors + dark-mode elevation

**Files:**
- Modify: `components/modern-button.tsx`

- [ ] **Step 1: Add scheme + onAccent resolution and swap the elevation source**

Change the import line:

```ts
import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

to:

```ts
import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

At the top of the component body, change:

```ts
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const surfaceColor = useThemeColor({}, 'surface');
    const disabledSurfaceColor = useThemeColor({}, 'backgroundTertiary');
    const borderColor = useThemeColor({}, 'border');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
```

to:

```ts
    const colorScheme = useColorScheme();
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const surfaceColor = useThemeColor({}, 'surface');
    const disabledSurfaceColor = useThemeColor({}, 'backgroundTertiary');
    const borderColor = useThemeColor({}, 'border');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const onAccentColor = useThemeColor({}, 'onAccent');
```

- [ ] **Step 2: Replace the elevation spread in `baseStyle`**

Change:

```ts
        opacity: loading ? 0.85 : 1,
        ...DesignSystem.elevation[1],
    };
```

to:

```ts
        opacity: loading ? 0.85 : 1,
        ...getElevation(colorScheme, 1),
    };
```

- [ ] **Step 3: Fix the primary-variant text color**

Change:

```ts
    if (variant === 'primary') {
        const isDisabled = disabled || loading;
        const contentColor = isDisabled ? textSecondaryColor : 'white';
```

to:

```ts
    if (variant === 'primary') {
        const isDisabled = disabled || loading;
        const contentColor = isDisabled ? textSecondaryColor : onAccentColor;
```

(`onAccent` is dark ink in both themes — the ember/tide fills aren't dark enough for white text to pass 4.5:1, verified in the design spec.)

- [ ] **Step 4: Fix the ghost-variant elevation spread**

Change:

```ts
                {
                    backgroundColor: 'transparent',
                    ...(DesignSystem.elevation[1] || {}),
                },
```

to:

```ts
                {
                    backgroundColor: 'transparent',
                    ...getElevation(colorScheme, 1),
                },
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add components/modern-button.tsx
git commit -m "fix: ModernButton uses text-safe onAccent color and dark-mode elevation"
```

---

### Task 10: `ModernCard` / `ModernView` — dark-mode elevation + tightened default radius

**Files:**
- Modify: `components/modern-card.tsx`
- Modify: `components/modern-view.tsx`

- [ ] **Step 1: `ModernCard` — import and scheme**

Change:

```ts
import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

to:

```ts
import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

Change the default prop and add scheme resolution:

```ts
export function ModernCard({
    children,
    title,
    subtitle,
    gradient = false,
    elevation = 2,
    padding = 'lg',
    borderRadius = 'xl',
    style,
}: ModernCardProps) {
    const surfaceColor = useThemeColor({}, 'surface');

    const baseStyle = {
        borderRadius: DesignSystem.borderRadius[borderRadius],
        padding: DesignSystem.spacing[padding],
        ...DesignSystem.elevation[elevation],
    };
```

to:

```ts
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

    const baseStyle = {
        borderRadius: DesignSystem.borderRadius[borderRadius],
        padding: DesignSystem.spacing[padding],
        ...getElevation(colorScheme, elevation),
    };
```

(Default `borderRadius` comes down from `'xl'` (20) to `'lg'` (16) — callers that want the larger hero radius pass `borderRadius="2xl"` explicitly, which the Home screen hero card already does via its own inline gradient, not `ModernCard`.)

- [ ] **Step 2: `ModernView` — same pattern**

Change:

```ts
import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

to:

```ts
import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
```

Change:

```ts
    const colorKey = variant === 'surface' ? 'surface' :
        variant === 'surfaceSecondary' ? 'surfaceSecondary' : 'background';
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

    const baseStyle = {
        backgroundColor,
        borderRadius: DesignSystem.borderRadius[borderRadius],
        ...(padding && { padding: DesignSystem.spacing[padding] }),
        ...(elevation > 0 && DesignSystem.elevation[elevation]),
    };
```

to:

```ts
    const colorScheme = useColorScheme();
    const colorKey = variant === 'surface' ? 'surface' :
        variant === 'surfaceSecondary' ? 'surfaceSecondary' : 'background';
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

    const baseStyle = {
        backgroundColor,
        borderRadius: DesignSystem.borderRadius[borderRadius],
        ...(padding && { padding: DesignSystem.spacing[padding] }),
        ...(elevation > 0 && getElevation(colorScheme, elevation)),
    };
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add components/modern-card.tsx components/modern-view.tsx
git commit -m "fix: dark-mode elevation and tightened default radius for ModernCard/ModernView"
```

---

### Task 11: Retoken `components/compact-stats.tsx`

**Files:**
- Modify: `components/compact-stats.tsx`

**Why in Foundation:** Directly rendered on the Home screen (three stat tiles), currently hardcodes `Colors.light.border/backgroundSecondary/backgroundTertiary` in a module-level `StyleSheet.create` (static, won't repaint in dark mode) and `Colors.light.success` for the completed-dot color.

- [ ] **Step 1: Move theme-dependent values into the component and resolve them via hooks**

Replace the full file with:

```tsx
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
```

(The card's own shadow, `DesignSystem.elevation[1]`, is left as the light-mode recipe here rather than switched to `getElevation` — this component sits inside a horizontal row of 3 on Home where a hairline-border dark-mode treatment would look identical to its sibling `ModernCard`s; low visual risk either way, but keeping this one simple avoids adding another hook dependency to a leaf component. If a dark-mode elevation seam is visible during Task 17 verification, swap this line for `...getElevation(colorScheme, 1)` the same way Task 10 did.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/compact-stats.tsx
git commit -m "fix: make CompactStats fully theme-aware (was static light-only styles)"
```

---

### Task 12: Rewrite `components/daily/task-list.tsx` to be theme-aware and use `IconSymbol`

**Files:**
- Modify: `components/daily/task-list.tsx`

**Why in Foundation:** Rendered directly (not behind a modal) inside the Home screen's "Dzisiejsze zadania" card. Currently 100% hardcoded (`Colors.light.*` and raw hex baked into a module-level `StyleSheet.create`) and uses raw `Ionicons` — the only icon-family inconsistency remaining on the Home screen after Task 7.

- [ ] **Step 1: Replace the full file**

```tsx
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, DesignSystem } from '../../constants/theme';
import { Task } from '../../lib/types';
import { useAppStore } from '../../stores/app-store';
import { IconSymbol } from '../ui/icon-symbol';

interface TaskListProps {
    tasks: Task[];
    showCompleted?: boolean;
    emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
    tasks,
    showCompleted = true,
    emptyMessage = "Brak zadań. Nagraj notatkę głosową, aby automatycznie dodać zadania!",
}) => {
    const { toggleTaskCompletion, deleteTask } = useAppStore();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const surfaceColor = useThemeColor({}, 'surface');
    const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const iconSecondary = useThemeColor({}, 'iconSecondary');
    const successColor = useThemeColor({}, 'success');
    const errorColor = useThemeColor({}, 'error');
    const warningColor = useThemeColor({}, 'warning');
    const backgroundColor = useThemeColor({}, 'background');

    const filteredTasks = showCompleted
        ? tasks
        : tasks.filter(task => !task.completed);

    const handleToggleComplete = (taskId: string) => {
        toggleTaskCompletion(taskId);
    };

    const handleDeleteTask = (task: Task) => {
        Alert.alert(
            'Usuń zadanie',
            `Czy na pewno chcesz usunąć "${task.title}"?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: () => deleteTask(task.id)
                },
            ]
        );
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return errorColor;
            case 'medium': return warningColor;
            case 'low': return successColor;
            default: return iconSecondary;
        }
    };

    const getPriorityIcon = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'arrow.up';
            case 'medium': return 'minus';
            case 'low': return 'arrow.down';
            default: return 'minus';
        }
    };

    const renderTask = (task: Task) => (
        <View
            key={task.id}
            style={[
                styles.taskContainer,
                { backgroundColor: surfaceColor, ...DesignSystem.elevation[1] },
                task.completed && { backgroundColor: surfaceSecondary, opacity: 0.7 }
            ]}
        >
            <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleComplete(task.id)}
            >
                <IconSymbol
                    name={task.completed ? 'checkmark.circle.fill' : 'circle'}
                    size={24}
                    color={task.completed ? successColor : iconSecondary}
                />
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                    <Text style={[
                        styles.taskTitle,
                        { color: textColor },
                        task.completed && { color: iconSecondary, textDecorationLine: 'line-through' }
                    ]}>
                        {task.title}
                    </Text>
                    <View style={styles.priorityContainer}>
                        <IconSymbol
                            name={getPriorityIcon(task.priority)}
                            size={16}
                            color={getPriorityColor(task.priority)}
                        />
                    </View>
                </View>

                {task.description && (
                    <Text style={[
                        styles.taskDescription,
                        { color: textSecondary },
                        task.completed && { color: iconSecondary, textDecorationLine: 'line-through' }
                    ]}>
                        {task.description}
                    </Text>
                )}

                <View style={styles.taskMeta}>
                    {task.category && (
                        <View style={[styles.category, { backgroundColor }]}>
                            <Text style={[styles.categoryText, { color: textColor }]}>{task.category}</Text>
                        </View>
                    )}
                    {task.dueDate && (
                        <Text style={[styles.dueDate, { color: textSecondary }]}>
                            Termin: {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                        </Text>
                    )}
                    {task.extractedFromVoiceNoteId && (
                        <IconSymbol name="mic" size={14} color={textSecondary} />
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(task)}
            >
                <IconSymbol name="trash" size={20} color={textSecondary} />
            </TouchableOpacity>
        </View>
    );

    if (filteredTasks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <IconSymbol name="checklist" size={64} color={iconSecondary} />
                <Text style={[styles.emptyText, { color: textSecondary }]}>{emptyMessage}</Text>
            </View>
        );
    }

    return (
        <View style={styles.listContainer}>
            {filteredTasks.map(renderTask)}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 8,
        paddingBottom: 20,
    },
    taskContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginVertical: 4,
        borderRadius: DesignSystem.borderRadius.md,
    },
    checkbox: {
        marginRight: 12,
        marginTop: 2,
    },
    taskContent: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    taskTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    priorityContainer: {
        marginLeft: 8,
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    category: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dueDate: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 4,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
});
```

Note: `colors` (from `Colors[colorScheme]`) is resolved but intentionally unused beyond feeding the pattern used elsewhere in the codebase — remove the `const colors = Colors[colorScheme];` line if `tsc`/eslint flags it as unused after this rewrite, since every color used here already goes through `useThemeColor`.

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors. If lint flags the unused `colors`/`Colors` import, remove them.

- [ ] **Step 3: Commit**

```bash
git add components/daily/task-list.tsx
git commit -m "feat: make TaskList theme-aware and migrate icons to IconSymbol"
```

---

### Task 13: Retoken the `SubscriptionGate` paywall

**Files:**
- Modify: `components/subscription/subscription-gate.tsx`

**Why in Foundation:** Wraps the Home screen (`<SubscriptionGate feature="start_screen">`). Currently reads the light-only legacy `Colors.background/cardBackground/text/textSecondary/error/primary` top-level exports — structurally incapable of dark mode, not just unstyled for it. This task retones the paywall UI only; the subscription purchase flow it opens (`SubscriptionScreen` modal) stays Phase 2.

- [ ] **Step 1: Replace the full file**

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useThemeColor } from '../../hooks/use-theme-color';
import { useAppStore } from '../../stores/app-store';
import { SubscriptionScreen } from './subscription-screen';

interface SubscriptionGateProps {
    feature: 'start_screen' | 'ai_chat' | 'voice_notes' | 'sleep_screen' | 'analytics' | 'premium_exports' | 'routines_screen';
    children: React.ReactNode;
    screenTitle: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
    feature,
    children,
    screenTitle
}) => {
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const { subscriptionStatus, loadSubscriptionStatus } = useAppStore();
    const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor({}, 'background');
    const cardBackground = useThemeColor({}, 'cardBackground');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const errorColor = useThemeColor({}, 'error');
    const primaryColor = useThemeColor({}, 'primary');
    const onAccentColor = useThemeColor({}, 'onAccent');

    useEffect(() => {
        loadSubscriptionStatus();
    }, []);

    // Check if user has access to this feature
    const hasAccess = subscriptionStatus?.isPremiumUser || subscriptionStatus?.isOnTrial;
    const isTrialExpired = subscriptionStatus && !subscriptionStatus.isOnTrial && !subscriptionStatus.isPremiumUser;

    // Show paywall if no access
    if (!hasAccess && subscriptionStatus !== null) {
        return (
            <>
                <View style={[styles.paywallContainer, { backgroundColor }]}>
                    <View style={[styles.paywallContent, { backgroundColor: cardBackground }]}>
                        <Text style={[styles.paywallTitle, { color: textColor }]}>Funkcja Premium</Text>
                        <Text style={[styles.paywallMessage, { color: textSecondary }]}>
                            {screenTitle} jest dostępny tylko w planie Pro
                        </Text>

                        {isTrialExpired && (
                            <Text style={[styles.trialExpiredText, { color: errorColor, backgroundColor: colorScheme === 'dark' ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)' }]}>
                                Twój trial wygasł. Przejdź na plan Pro, aby kontynuować korzystanie z premium funkcji.
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[styles.upgradeButton, { backgroundColor: primaryColor }]}
                            onPress={() => setShowSubscriptionModal(true)}
                        >
                            <Text style={[styles.upgradeButtonText, { color: onAccentColor }]}>
                                Przejdź na Pro
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.featuresTitle, { color: textColor }]}>Co zyskujesz z planem Pro:</Text>
                        <View style={styles.featuresList}>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Nieograniczony dostęp do AI asystenta</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Zaawansowane analityki zdrowia</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Monitoring snu z AI</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Eksport danych w każdym formacie</Text>
                            <Text style={[styles.featureItem, { color: textSecondary }]}>Personalizowane rekomendacje</Text>
                        </View>
                    </View>
                </View>

                <Modal
                    visible={showSubscriptionModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <SubscriptionScreen
                        onClose={() => setShowSubscriptionModal(false)}
                    />
                </Modal>
            </>
        );
    }

    // Show loading state while checking subscription
    if (subscriptionStatus === null) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor }]}>
                <Text style={[styles.loadingText, { color: textSecondary }]}>Sprawdzam dostęp...</Text>
            </View>
        );
    }

    // User has access - render children
    return <>{children}</>;
};

const styles = StyleSheet.create({
    paywallContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    paywallContent: {
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        maxWidth: '100%',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    paywallTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    paywallMessage: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    trialExpiredText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        padding: 15,
        borderRadius: 12,
        lineHeight: 22,
    },
    upgradeButton: {
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 25,
        marginBottom: 30,
    },
    upgradeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    featuresTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    featuresList: {
        width: '100%',
    },
    featureItem: {
        fontSize: 16,
        marginBottom: 8,
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },
});
```

(Dropped the 🔒/✅ emoji bullets in favor of plain copy — the design spec's copy rules call for a calm, precise register, and `screenTitle`/feature copy elsewhere in the app doesn't use emoji either.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/subscription/subscription-gate.tsx
git commit -m "fix: make SubscriptionGate paywall dark-mode capable (was light-only legacy Colors)"
```

---

### Task 14: Rebuild the Home screen (`app/(tabs)/index.tsx`)

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `getElevation` (Task 2), `IconSymbol` new names (Task 7), `Fonts` (Task 2, unchanged export).

- [ ] **Step 1: Fix the hardcoded-light hero gradient and switch icon names touched by Task 7**

Change the import line:

```ts
import { Colors, DesignSystem } from '@/constants/theme';
```

to:

```ts
import { Colors, DesignSystem, Fonts } from '@/constants/theme';
```

Change the hero `LinearGradient` (the bug: it always used `Colors.light.*` even in dark mode):

```tsx
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryLight] as readonly [string, string, ...string[]]}
            locations={[0, 1] as readonly [number, number, ...number[]]}
```

to:

```tsx
          <LinearGradient
            colors={[colors.primary, colors.primaryLight] as readonly [string, string, ...string[]]}
            locations={[0, 1] as readonly [number, number, ...number[]]}
```

- [ ] **Step 2: Apply the mono/tabular-numerals treatment to the hero percentage and stat numbers**

Change:

```tsx
                <ThemedText
                  variant="headlineMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '700' }}
                >
                  {getDayProgress()}%
                </ThemedText>
```

to:

```tsx
                <ThemedText
                  variant="headlineMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '700', fontFamily: Fonts.mono }}
                >
                  {getDayProgress()}%
                </ThemedText>
```

Apply the same `fontFamily: Fonts.mono` addition to the three `titleMedium` stat numbers in the Stats Row (Productywność / Dni z rzędu / Aktywności) — each currently reads:

```tsx
                <ThemedText
                  variant="titleMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '600' }}
                >
```

Change each to:

```tsx
                <ThemedText
                  variant="titleMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '600', fontFamily: Fonts.mono }}
                >
```

(Three occurrences: productivity score, streak count, activity count.)

- [ ] **Step 3: Fix `circle` icon usage now that `IconSymbol` has a real mapping for it**

No code change needed here — `CompactStats title="Do zrobienia" icon="circle"` already passes the literal string `'circle'`, which Task 7 added a valid `'circle-outline'` mapping for. Confirm during Task 17 visual verification that it renders (previously fell through to a non-existent raw MaterialIcons lookup and likely rendered blank or a fallback glyph).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "fix: Home hero gradient now theme-aware, mono numerals for data displays"
```

---

### Task 15: Rebuild the Profile screen (`app/(tabs)/profile.tsx`)

**Files:**
- Modify: `app/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: `useColorScheme` (Task 4), `useThemeColor`, `useAppStore().themePreference`/`setThemePreference` (Task 3), `IconSymbol` (Task 7), `getElevation` (Task 2).
- Produces: the three-way System/Light/Dark control the design spec calls for.

**Why this is the biggest single file in the plan:** Profile currently has zero theme awareness anywhere — every color is a literal hex or `Colors.light.*`, and the `StyleSheet.create` is a module-level static object, which cannot react to theme changes at all. This is a full rebuild, not a patch.

- [ ] **Step 1: Replace the full file**

```tsx
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DesignSystem, getElevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
// import { locationService } from '@/lib/services/location-service';
import { notificationService } from '@/lib/services/notification-service';
import { useAppStore } from '@/stores/app-store';

type ThemePreference = 'system' | 'light' | 'dark';

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const {
        user, userSettings, setUserSettings, updateUserSettings, logout,
        subscription, subscriptionStatus, themePreference, setThemePreference
    } = useAppStore();

    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'surface');
    const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
    const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const iconSecondary = useThemeColor({}, 'iconSecondary');
    const borderColor = useThemeColor({}, 'border');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryDark = useThemeColor({}, 'primaryDark');
    const onAccentColor = useThemeColor({}, 'onAccent');
    const successColor = useThemeColor({}, 'success');
    const errorColor = useThemeColor({}, 'error');

    // Get subscription details for enterprise display
    const getSubscriptionDisplayInfo = () => {
        if (!subscription) {
            return {
                planName: 'Plan Podstawowy',
                status: 'Aktywny',
                renewalDate: null,
                isActive: false,
                isPremium: false
            };
        }

        const planNames = {
            'basic': 'Basic',
            'premium': 'Premium',
            'premium-yearly': 'Premium Roczny'
        };

        return {
            planName: planNames[subscription.id as keyof typeof planNames] || subscription.name,
            status: subscription.isActive ? 'Aktywny' : 'Nieaktywny',
            renewalDate: subscription.nextBillingDate,
            isActive: subscription.isActive,
            isPremium: subscription.id !== 'basic'
        };
    };

    const subscriptionInfo = getSubscriptionDisplayInfo();

    // Lokalne stany dla ustawień
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(
        userSettings?.notificationsEnabled ?? true
    );
    const [pushNotifications, setPushNotifications] = React.useState(
        userSettings?.pushNotifications ?? false
    );
    const [analyticsEnabled, setAnalyticsEnabled] = React.useState(
        userSettings?.analyticsEnabled ?? true
    );
    const [locationTrackingEnabled, setLocationTrackingEnabled] = React.useState(
        userSettings?.locationTrackingEnabled ?? false
    );
    const [betaFeaturesEnabled, setBetaFeaturesEnabled] = React.useState(
        userSettings?.betaFeaturesEnabled ?? false
    );

    const handleLogout = () => {
        Alert.alert(
            'Wyloguj się',
            'Czy na pewno chcesz się wylogować?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyloguj',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    const handleSettingChange = async (setting: string, value: boolean) => {
        if (!userSettings) return;

        try {
            const newSettings = { ...userSettings, [setting]: value };
            setUserSettings(newSettings);
            await updateUserSettings({ [setting]: value });

            switch (setting) {
                case 'notificationsEnabled':
                    if (value) {
                        await notificationService.initialize();
                    } else {
                        await notificationService.cancelAllNotifications();
                    }
                    break;
                case 'pushNotifications':
                    if (value) {
                        const granted = await notificationService.requestPushPermissions();
                        if (granted) {
                            await notificationService.getPushToken();
                        }
                    }
                    break;
                case 'betaFeaturesEnabled':
                    if (value) {
                        await notificationService.notifyAI('Funkcje beta zostały włączone! Odkryj nowe możliwości.');
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Failed to update setting:', error);
            const revertedSettings = { ...userSettings, [setting]: !value };
            setUserSettings(revertedSettings);
            Alert.alert(
                'Błąd',
                'Nie udało się zapisać ustawienia. Sprawdź połączenie internetowe i spróbuj ponownie.'
            );
        }
    };

    const profileMenuItems = [
        {
            title: 'Zarządzanie subskrypcją',
            description: `${subscriptionInfo.planName} • ${subscriptionInfo.status}`,
            icon: 'creditcard.fill' as const,
            onPress: () => navigation.navigate('Subscription'),
            isPremium: true,
        },
        {
            title: 'Historia płatności',
            description: 'Zobacz historię transakcji i faktury',
            icon: 'doc.text.fill' as const,
            onPress: () => Alert.alert('Historia płatności', 'Funkcja zostanie wkrótce dodana'),
            isPremium: true,
        },
        {
            title: 'Cele osobiste',
            description: 'Ustaw swoje cele i prioryty',
            icon: 'paperplane.fill' as const,
            onPress: () => Alert.alert('Cele', 'Funkcja celów zostanie wkrótce dodana'),
        },
        {
            title: 'Historia aktywności',
            description: 'Zobacz swoją aktywność w aplikacji',
            icon: 'chart.bar.fill' as const,
            onPress: () => Alert.alert('Historia', 'Funkcja historii zostanie wkrótce dodana'),
        },
        {
            title: 'Eksport danych',
            description: 'Pobierz swoje dane w formacie CSV',
            icon: 'list.bullet' as const,
            onPress: () => Alert.alert('Eksport', 'Funkcja eksportu zostanie wkrótce dodana'),
        },
    ];

    const aboutMenuItems = [
        {
            title: 'Pomoc i wsparcie',
            description: 'Znajdź odpowiedzi na pytania',
            icon: 'questionmark.circle' as const,
            onPress: () => Alert.alert('Pomoc', 'Skontaktuj się z naszym zespołem wsparcia'),
        },
        {
            title: 'Polityka prywatności',
            description: 'Jak chronimy Twoje dane',
            icon: 'shield' as const,
            onPress: () => Alert.alert('Prywatność', 'Polityka prywatności zostanie wyświetlona'),
        },
        {
            title: 'Regulamin',
            description: 'Warunki korzystania z aplikacji',
            icon: 'doc.text' as const,
            onPress: () => Alert.alert('Regulamin', 'Regulamin zostanie wyświetlony'),
        },
        {
            title: 'Wyloguj się',
            description: 'Zakończ sesję w aplikacji',
            icon: 'rectangle.portrait.and.arrow.right' as const,
            onPress: handleLogout,
            isDestructive: true,
        },
    ];

    const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
        { value: 'system', label: 'System', icon: 'circle.lefthalf.filled' },
        { value: 'light', label: 'Jasny', icon: 'sun.max.fill' },
        { value: 'dark', label: 'Ciemny', icon: 'moon.fill' },
    ];

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                    <View style={styles.profileSection}>
                        <View style={[styles.avatarContainer, { backgroundColor: backgroundSecondary }]}>
                            <IconSymbol name="person.circle" size={48} color={primaryColor} />
                        </View>
                        <View style={styles.profileInfo}>
                            <ThemedText variant="headlineMedium" style={styles.userName}>
                                {user?.name || 'Użytkownik'}
                            </ThemedText>
                            <ThemedText variant="bodyMedium" color="secondary">
                                {user?.email || 'email@example.com'}
                            </ThemedText>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <IconSymbol name="chevron.right" size={16} color={iconSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Wygląd
                    </ThemedText>
                    <View style={[styles.themeSwitcher, { backgroundColor: surfaceColor, borderColor, ...getElevation(colorScheme, 1) }]}>
                        {themeOptions.map((option) => {
                            const isSelected = themePreference === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.themeOption,
                                        isSelected && { backgroundColor: primaryColor },
                                    ]}
                                    onPress={() => setThemePreference(option.value)}
                                >
                                    <IconSymbol
                                        name={option.icon}
                                        size={18}
                                        color={isSelected ? onAccentColor : textSecondary}
                                    />
                                    <ThemedText
                                        variant="labelLarge"
                                        style={[
                                            styles.themeOptionLabel,
                                            { color: isSelected ? onAccentColor : textSecondary },
                                        ]}
                                    >
                                        {option.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Subscription Status Section */}
                <View style={styles.section}>
                    <View style={[
                        styles.subscriptionCard,
                        { backgroundColor: surfaceColor, borderColor: subscriptionInfo.isPremium ? primaryColor : borderColor, ...getElevation(colorScheme, 2) },
                        !subscriptionInfo.isPremium && { backgroundColor: surfaceSecondary },
                    ]}>
                        <View style={styles.subscriptionHeader}>
                            <IconSymbol
                                name={subscriptionInfo.isPremium ? "crown.fill" : "creditcard"}
                                size={24}
                                color={primaryColor}
                            />
                            <ThemedText variant="titleMedium" style={styles.subscriptionTitle}>{subscriptionInfo.planName}</ThemedText>
                            <View style={[
                                styles.subscriptionBadge,
                                { backgroundColor: subscriptionInfo.isActive ? successColor : errorColor },
                            ]}>
                                <ThemedText variant="labelSmall" style={{ color: onAccentColor === '#101319' ? '#FFFFFF' : '#0A0D13' }}>
                                    {subscriptionInfo.status}
                                </ThemedText>
                            </View>
                        </View>
                        {subscriptionInfo.renewalDate && (
                            <ThemedText variant="bodyMedium" color="secondary" style={styles.subscriptionRenewal}>
                                Odnowienie: {new Date(subscriptionInfo.renewalDate).toLocaleDateString('pl-PL')}
                            </ThemedText>
                        )}
                        <ThemedText variant="bodyMedium" color="secondary" style={styles.subscriptionDescription}>
                            {subscriptionInfo.isPremium
                                ? 'Masz dostęp do wszystkich funkcji Premium'
                                : 'Przejdź na Premium aby odblokować zaawansowane funkcje'
                            }
                        </ThemedText>
                        {!subscriptionInfo.isPremium && (
                            <TouchableOpacity
                                style={[styles.subscriptionButton, { backgroundColor: primaryColor }]}
                                onPress={() => navigation.navigate('Subscription')}
                            >
                                <ThemedText variant="titleSmall" style={{ color: onAccentColor, fontWeight: '600' }}>
                                    Przejdź na Premium
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Personalization Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Personalizacja
                    </ThemedText>

                    <View style={[styles.settingsContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="bell.fill" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Powiadomienia</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
                                        Wyłącz gdy potrzebujesz skupienia lub odpoczynku
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={(value) => {
                                    setNotificationsEnabled(value);
                                    handleSettingChange('notificationsEnabled', value);
                                }}
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="app.badge" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Powiadomienia push</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
                                        Alternatywa: otrzymuj tylko powiadomienia email
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={pushNotifications}
                                onValueChange={(value) => {
                                    setPushNotifications(value);
                                    handleSettingChange('pushNotifications', value);
                                }}
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>
                    </View>
                </View>

                {/* Privacy & Analytics Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Prywatność i analityka
                    </ThemedText>

                    <View style={[styles.settingsContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="chart.bar.xaxis" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Zaawansowana analityka</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
                                        Wyłącz jeśli nie chcesz analizy wzorców zachowań
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={analyticsEnabled}
                                onValueChange={(value) => {
                                    setAnalyticsEnabled(value);
                                    handleSettingChange('analyticsEnabled', value);
                                }}
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="location" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Lokalizacja</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
                                        Wyłącz dla prywatności i oszczędzania baterii
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={locationTrackingEnabled}
                                onValueChange={(value) => {
                                    setLocationTrackingEnabled(value);
                                    handleSettingChange('locationTrackingEnabled', value);
                                }}
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="flask" size={20} color={primaryColor} />
                                <View style={styles.settingText}>
                                    <ThemedText variant="bodyLarge" style={styles.settingTitle}>Funkcje beta</ThemedText>
                                    <ThemedText variant="bodySmall" color="secondary">
                                        Wyłącz jeśli wolisz stabilność niż nowości
                                    </ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={betaFeaturesEnabled}
                                onValueChange={(value) => {
                                    setBetaFeaturesEnabled(value);
                                    handleSettingChange('betaFeaturesEnabled', value);
                                }}
                                trackColor={{ false: borderColor, true: primaryColor }}
                                thumbColor={surfaceColor}
                            />
                        </View>
                    </View>
                </View>

                {/* Profile Menu */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Profil
                    </ThemedText>

                    <View style={[styles.menuContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        {profileMenuItems.map((item, index) => (
                            <TouchableOpacity
                                key={`profile-${index}`}
                                style={[styles.menuItem, { borderBottomColor: borderColor }, index === profileMenuItems.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <IconSymbol name={item.icon} size={20} color={primaryColor} />
                                    <View style={styles.menuItemText}>
                                        <View style={styles.menuItemTitleRow}>
                                            <ThemedText variant="bodyLarge" style={styles.menuItemTitle}>{item.title}</ThemedText>
                                            {item.isPremium && !subscriptionInfo.isPremium && (
                                                <View style={[styles.premiumIndicator, { backgroundColor: primaryColor }]}>
                                                    <ThemedText variant="labelSmall" style={{ color: onAccentColor, fontWeight: '700' }}>PRO</ThemedText>
                                                </View>
                                            )}
                                        </View>
                                        <ThemedText variant="bodySmall" color="secondary">
                                            {item.description}
                                        </ThemedText>
                                    </View>
                                </View>
                                <IconSymbol name="chevron.right" size={16} color={iconSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <ThemedText variant="titleMedium" style={styles.sectionTitle}>
                        Informacje
                    </ThemedText>

                    <View style={[styles.menuContainer, { backgroundColor: surfaceColor, ...getElevation(colorScheme, 1) }]}>
                        {aboutMenuItems.map((item, index) => (
                            <TouchableOpacity
                                key={`about-${index}`}
                                style={[styles.menuItem, { borderBottomColor: borderColor }, index === aboutMenuItems.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <IconSymbol
                                        name={item.icon}
                                        size={20}
                                        color={item.isDestructive ? errorColor : primaryColor}
                                    />
                                    <View style={styles.menuItemText}>
                                        <ThemedText
                                            variant="bodyLarge"
                                            style={[styles.menuItemTitle, item.isDestructive && { color: errorColor }]}
                                        >
                                            {item.title}
                                        </ThemedText>
                                        <ThemedText variant="bodySmall" color="secondary">
                                            {item.description}
                                        </ThemedText>
                                    </View>
                                </View>
                                {!item.isDestructive && (
                                    <IconSymbol name="chevron.right" size={16} color={iconSecondary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.appInfoSection}>
                    <ThemedText variant="bodySmall" color="secondary">Wersja 1.0.0</ThemedText>
                    <ThemedText variant="bodySmall" color="tertiary">© 2026 Three Three</ThemedText>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        marginBottom: 4,
    },
    editButton: {
        padding: 8,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    themeSwitcher: {
        flexDirection: 'row',
        borderRadius: DesignSystem.borderRadius.lg,
        padding: 4,
        gap: 4,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: DesignSystem.borderRadius.md,
    },
    themeOptionLabel: {
        fontWeight: '600',
    },
    settingsContainer: {
        borderRadius: DesignSystem.borderRadius.lg,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        marginBottom: 2,
        fontWeight: '500',
    },
    menuContainer: {
        borderRadius: DesignSystem.borderRadius.lg,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        marginBottom: 2,
        fontWeight: '500',
    },
    menuItemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    premiumIndicator: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    subscriptionCard: {
        borderRadius: DesignSystem.borderRadius.lg,
        padding: 20,
        marginBottom: 8,
        borderWidth: 1.5,
    },
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    subscriptionTitle: {
        flex: 1,
    },
    subscriptionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: DesignSystem.borderRadius.full,
    },
    subscriptionRenewal: {
        marginBottom: 8,
    },
    subscriptionDescription: {
        marginBottom: 16,
    },
    subscriptionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: DesignSystem.borderRadius.md,
        alignItems: 'center',
    },
    appInfoSection: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 4,
    },
});
```

Notes on deliberate changes from the original:
- Dropped the off-brand `#FFD700` gold premium styling entirely — premium state is now communicated with the same ember `primaryColor` used everywhere else (crown icon, PRO badge, card border), keeping premium/non-premium visually differentiated by presence-of-border-and-badge rather than an unrelated hue.
- Subscription status badge uses `successColor`/`errorColor` tokens instead of hardcoded `#10B981`/`#F87171` (same values today, but now theme-reactive for dark mode's `#34D399`/`#F87171` variants).
- `Switch` components use theme `borderColor`/`primaryColor`/`surfaceColor` instead of the hardcoded `#767577`/`#f5dd4b`/`#f4f3f4` track/thumb colors (which visually clashed with the ember palette and had no dark variant).
- Menu list `borderBottomWidth` is suppressed on each list's last item instead of every item, avoiding the doubled-border-then-empty-strip look at the bottom of the original static `StyleSheet`.

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/profile.tsx"
git commit -m "feat: rebuild Profile screen on Night Signal tokens with System/Light/Dark toggle"
```

---

### Task 16: Manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0 (or only pre-existing, unrelated errors — note any and confirm they predate this plan via `git stash` + re-run if in doubt).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0 (or only pre-existing warnings unrelated to touched files).

- [ ] **Step 3: Run the app**

Run: `npm run ios` (or `npm run android`)

- [ ] **Step 4: Visual check — system light mode**

With the OS appearance set to Light: open Home, confirm the hero card shows the ember gradient (not the old indigo/purple), all three `CompactStats` tiles render icons (including the "Do zrobienia" circle icon), task list items render with `IconSymbol` icons (no blank glyphs). Open Profile, confirm the header/cards/switches all read as light ember-tinted surfaces (no leftover pure-white-on-white or hardcoded-gold elements), and the new "Wygląd" System/Light/Dark control is visible with "System" selected/highlighted.

- [ ] **Step 5: Visual check — system dark mode**

Switch the OS/simulator appearance to Dark (leave in-app preference at "System"). Confirm Home and Profile both re-render in dark ink tones — specifically check the tab bar (hairline border, not an invisible shadow), the hero card gradient (lighter ember tones, still legible), Profile's subscription card and menu lists (dark surfaces with visible hairline separators, not the old hardcoded white cards).

- [ ] **Step 6: Visual check — manual override**

In Profile, tap "Jasny" while the OS is set to Dark — confirm the whole app (Home + Profile + tab bar) immediately switches to light regardless of OS setting. Tap "Ciemny" — confirms forced dark regardless of OS. Tap "System" — confirms it returns to following the OS setting. Force-quit and relaunch the app after selecting "Ciemny" — confirm the preference persisted (still dark on relaunch, without touching OS settings).

- [ ] **Step 7: Contrast spot-check**

With a color picker or by eye at 1x zoom, confirm: ember/tide-filled buttons show dark text (not washed-out white-on-orange), the Profile subscription status badge text is legible in both themes, and no text anywhere on Home/Profile looks low-contrast against its background in either theme.

- [ ] **Step 8: Final commit (if any fixes were needed during verification)**

If Steps 4-7 surfaced any fixes, commit them individually with a message describing what was wrong, e.g.:

```bash
git add <fixed-file>
git commit -m "fix: <specific issue found during Foundation verification>"
```
