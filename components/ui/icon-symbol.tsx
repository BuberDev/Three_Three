// Icon component using MaterialIcons (react-native-vector-icons) on all platforms.

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, string>;
type IconSymbolName = string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'mic': 'mic',
  'mic.fill': 'mic',
  'mic.slash': 'mic-off',
  'moon': 'nightlight-round',
  'moon.fill': 'nightlight-round',
  'moon.zzz': 'bedtime',
  'list.bullet': 'list',
  'list.bullet.clipboard': 'assignment',
  'brain': 'psychology',
  'person.circle': 'person',
  'person.fill': 'person',
  'chart.bar': 'bar-chart',
  'chart.bar.fill': 'bar-chart',
  'chart.bar.xaxis': 'bar-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'chart.pie': 'pie-chart',
  'chart.pie.fill': 'pie-chart',
  'message.circle.fill': 'chat',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'waveform': 'graphic-eq',
  'waveform.circle.fill': 'graphic-eq',
  'square.and.pencil': 'edit',
  'pencil': 'edit',
  'creditcard.fill': 'credit-card',
  'arrow.left': 'arrow-back',
  'ellipsis.horizontal': 'more-horiz',
  'chatbubble': 'chat-bubble',
  'folder': 'folder',
  'analytics': 'analytics',
  'code': 'code',
  'airplane': 'flight',
  'app.badge': 'apps',
  'battery.100': 'battery-full',
  'bell.fill': 'notifications',
  'bolt.fill': 'bolt',
  'briefcase.fill': 'work',
  'calendar': 'event',
  'calendar.badge.plus': 'event',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'verified',
  'clock': 'schedule',
  'cloud': 'cloud',
  'crown.fill': 'workspace-premium',
  'exclamationmark.triangle': 'warning',
  'figure.run': 'directions-run',
  'flame.fill': 'local-fire-department',
  'flask': 'science',
  'heart.fill': 'favorite',
  'hourglass': 'hourglass-empty',
  'info.circle': 'info',
  'lightbulb': 'lightbulb',
  'location': 'location-on',
  'star': 'star-border',
  'star.fill': 'star',
  'sun.haze.fill': 'wb-sunny',
  'sun.max.fill': 'wb-sunny',
  'sunrise': 'wb-twilight',
  'target': 'track-changes',
  'trash': 'delete',
  'trophy': 'emoji-events',
  'trophy.fill': 'emoji-events',
  'wand.and.stars': 'auto-fix-high',
  'xmark': 'close',
};

/**
 * An icon component that renders Material Icons on every platform, mapped from SF Symbols names.
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
  return <MaterialIcons color={color as string} size={size} name={MAPPING[name] ?? name} style={style} />;
}
