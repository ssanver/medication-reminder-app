import { StyleSheet, View } from 'react-native';
import { theme } from '../../theme';

type SlideIndicatorProps = {
  count: number;
  activeIndex: number;
};

export function SlideIndicator({ count, activeIndex }: SlideIndicatorProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        return <View key={index} style={[styles.dot, active && styles.activeDot]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing[8],
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.neutral[300],
  },
  activeDot: {
    width: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryBlue[500],
  },
});
