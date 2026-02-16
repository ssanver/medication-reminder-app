import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppFontScale } from '../../features/accessibility/app-font-scale';
import { theme } from '../../theme';
import { AppIcon } from './app-icon';
import type { AppIconName } from './app-icon';

export type BottomNavItem = {
  key: string;
  label: string;
  icon: AppIconName;
};

type BottomNavProps = {
  items: BottomNavItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function BottomNav({ items, activeKey, onChange }: BottomNavProps) {
  const fontScale = useAppFontScale();
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable key={item.key} style={styles.item} onPress={() => onChange(item.key)}>
            <AppIcon
              name={item.icon}
              size={18}
              color={active ? theme.colors.primaryBlue[500] : theme.colors.semantic.textSecondary}
            />
            <Text style={[styles.label, { fontSize: theme.typography.captionScale.lRegular.fontSize * fontScale }, active && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.grid.marginWidth,
    paddingVertical: theme.spacing[8],
    gap: theme.spacing[8],
  },
  item: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
    borderRadius: theme.radius[16],
  },
  label: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  labelActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '600',
  },
});
