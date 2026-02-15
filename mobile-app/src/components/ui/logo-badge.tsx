import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type LogoBadgeProps = {
  compact?: boolean;
};

export function LogoBadge({ compact = false }: LogoBadgeProps) {
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <Text style={styles.logo}>💊 💊</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 112,
    minWidth: 220,
    borderRadius: theme.radius[32],
    backgroundColor: theme.colors.primaryBlue[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCompact: {
    minHeight: 72,
    minWidth: 140,
    borderRadius: theme.radius[24],
  },
  logo: {
    ...theme.typography.heading.h3Regular,
    color: '#FFFFFF',
  },
});
