import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'surface' | 'surfaceSecondary';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  ...otherProps
}: ThemedViewProps) {
  const colorKey = variant === 'surface' ? 'surface' :
    variant === 'surfaceSecondary' ? 'surfaceSecondary' : 'background';
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
