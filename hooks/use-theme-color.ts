/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ensureContrastColor } from '@/lib/utils/color-utils';

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

    // For text colors, use the failsafe function to ensure proper contrast
    const finalColor = (colorName === 'text' || colorName === 'textSecondary' || colorName === 'textTertiary')
      ? ensureContrastColor(theme, colorName as 'text' | 'textSecondary' | 'textTertiary')
      : resolvedColor;

    return finalColor;
  }
}
