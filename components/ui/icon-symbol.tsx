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
