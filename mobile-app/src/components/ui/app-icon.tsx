import { StyleSheet, Text } from 'react-native';
import { theme } from '../../theme';

export type AppIconName = 'home' | 'pill' | 'add' | 'settings' | 'back' | 'forward' | 'close' | 'check';

type AppIconProps = {
  name: AppIconName;
  color?: string;
  size?: number;
};

const glyphByName: Record<AppIconName, string> = {
  home: '⌂',
  pill: '💊',
  add: '⊕',
  settings: '⚙',
  back: '<',
  forward: '>',
  close: 'x',
  check: 'v',
};

export function AppIcon({ name, color = theme.colors.semantic.textSecondary, size = 14 }: AppIconProps) {
  return <Text style={[styles.icon, { color, fontSize: size }]}>{glyphByName[name]}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    ...theme.typography.bodyScale.xmMedium,
    includeFontPadding: false,
  },
});
