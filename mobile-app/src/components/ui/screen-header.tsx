import { StyleSheet, Text, View } from 'react-native';
import { useAppFontScale } from '../../features/accessibility/app-font-scale';
import { theme } from '../../theme';
import { IconButton } from './icon-button';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  leftAction?: { icon: string; onPress: () => void };
  rightAction?: { icon: string; onPress: () => void };
};

export function ScreenHeader({ title, subtitle, leftAction, rightAction }: ScreenHeaderProps) {
  const fontScale = useAppFontScale();
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.side}>{leftAction ? <IconButton icon={leftAction.icon} onPress={leftAction.onPress} /> : null}</View>
        <Text numberOfLines={1} style={[styles.title, { fontSize: theme.typography.heading.h5Semibold.fontSize * fontScale }]}>
          {title}
        </Text>
        <View style={styles.side}>{rightAction ? <IconButton icon={rightAction.icon} onPress={rightAction.onPress} /> : null}</View>
      </View>
      {subtitle ? <Text style={[styles.subtitle, { fontSize: theme.typography.bodyScale.mRegular.fontSize * fontScale }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing[16],
    gap: theme.spacing[8],
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 44,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
  },
  subtitle: {
    textAlign: 'center',
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
});
