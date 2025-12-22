import { Text, type TextProps } from 'react-native';

import { DesignSystem } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'displayLarge' | 'displayMedium' | 'displaySmall' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' |
  'titleLarge' | 'titleMedium' | 'titleSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall' |
  'labelLarge' | 'labelMedium' | 'labelSmall';
  color?: 'primary' | 'secondary' | 'tertiary';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  variant = 'bodyLarge',
  color = 'primary',
  ...rest
}: ThemedTextProps) {
  const colorKey = color === 'primary' ? 'text' :
    color === 'secondary' ? 'textSecondary' : 'textTertiary';
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  const typographyStyle = DesignSystem.typography[variant];

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

  return (
    <Text
      style={[
        {
          color: textColor,
          fontSize: typographyStyle.fontSize,
          lineHeight: typographyStyle.lineHeight,
          fontWeight: typographyStyle.fontWeight as any,
          letterSpacing: typographyStyle.letterSpacing,
        },
        style,
      ]}
      {...rest}
    />
  );
}


