import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './primary-button';
import { theme } from '../../theme';

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
};

export function EmptyState({ title, description, ctaLabel, onPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <PrimaryButton label={ctaLabel} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    padding: theme.spacing[16],
    gap: theme.spacing[16],
    backgroundColor: '#FFFFFF',
  },
  title: {
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
  },
  description: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
});
