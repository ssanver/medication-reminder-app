import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { theme } from '../theme';

type ReportsScreenProps = {
  onBack: () => void;
};

export function ReportsScreen({ onBack }: ReportsScreenProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Raporlar" subtitle="Haftalik ve aylik doz ozeti" leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.calendarCard}>
        <Text style={styles.cardTitle}>Ocak 2025</Text>
        <Text style={styles.cardText}>21 doz planlandi</Text>
        <Text style={styles.cardText}>18 doz alindi</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Basari</Text>
          <Text style={styles.statValue}>86%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Kacirilan</Text>
          <Text style={styles.statValueError}>3</Text>
        </View>
      </View>

      <View style={styles.trendCard}>
        <Text style={styles.cardTitle}>Haftalik trend</Text>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Pzt</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '85%' }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Sal</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '72%' }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Car</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '90%' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[16],
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  cardTitle: {
    ...theme.typography.heading.h6Medium,
    color: theme.colors.semantic.textPrimary,
  },
  cardText: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  statBox: {
    flex: 1,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  statLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  statValue: {
    ...theme.typography.heading.h4Medium,
    color: theme.colors.semantic.stateSuccess,
  },
  statValueError: {
    ...theme.typography.heading.h4Medium,
    color: theme.colors.semantic.stateError,
  },
  trendCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  barLabel: {
    width: 28,
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: theme.radius[8],
    backgroundColor: theme.colors.neutral[100],
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryBlue[500],
    borderRadius: theme.radius[8],
  },
});
