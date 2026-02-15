import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[8],
    marginBottom: theme.spacing[16],
  },
  title: {
    ...theme.typography.heading5,
    color: theme.colors.semantic.textPrimary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.semantic.textSecondary,
  },
});
