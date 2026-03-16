import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type LoadingStateCardProps = {
  title: string;
  description?: string;
  compact?: boolean;
};

export function LoadingStateCard({ title, description, compact = false }: LoadingStateCardProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={theme.colors.primaryBlue[500]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.pulseRow}>
        <View style={[styles.pulseLine, styles.pulseLineWide]} />
        <View style={styles.pulseLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[100],
    backgroundColor: theme.colors.semantic.cardBackground,
    paddingHorizontal: theme.spacing[24],
    paddingVertical: theme.spacing[24],
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  cardCompact: {
    paddingVertical: theme.spacing[16],
  },
  loaderWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryBlue[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  pulseRow: {
    width: '100%',
    marginTop: theme.spacing[4],
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  pulseLine: {
    height: 8,
    borderRadius: theme.radius[8],
    backgroundColor: theme.colors.neutral[100],
    width: '48%',
  },
  pulseLineWide: {
    width: '74%',
    backgroundColor: theme.colors.primaryBlue[50],
  },
});
