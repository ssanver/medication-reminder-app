import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

export type BottomNavItem = {
  key: string;
  label: string;
  icon: string;
};

type BottomNavProps = {
  items: BottomNavItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function BottomNav({ items, activeKey, onChange }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable key={item.key} style={styles.item} onPress={() => onChange(item.key)}>
            <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
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
  icon: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  iconActive: {
    color: theme.colors.primaryBlue[500],
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
