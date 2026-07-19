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
