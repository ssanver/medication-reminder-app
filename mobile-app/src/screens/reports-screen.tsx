import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { theme } from '../theme';

type ReportsScreenProps = {
  onBack: () => void;
};

export function ReportsScreen({ onBack }: ReportsScreenProps) {
  const weekly = [
    { label: 'Mon', value: 92 },
    { label: 'Tue', value: 76 },
    { label: 'Wed', value: 88 },
    { label: 'Thu', value: 60 },
    { label: 'Fri', value: 95 },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Reports" subtitle="Weekly and monthly adherence" leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Adherence</Text>
          <Text style={styles.summaryValue}>86%</Text>
          <Text style={styles.summaryHint}>18 of 21 doses taken</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Missed</Text>
          <Text style={[styles.summaryValue, styles.errorText]}>3</Text>
          <Text style={styles.summaryHint}>This month</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly trend</Text>
        {weekly.map((item) => (
          <View key={item.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${item.value}%` }]} />
            </View>
            <Text style={styles.barPercent}>{item.value}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medication report</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tableHead}>Medication</Text>
          <Text style={styles.tableHead}>Taken</Text>
          <Text style={styles.tableHead}>Missed</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Metformin</Text>
          <Text style={styles.tableCell}>12</Text>
          <Text style={[styles.tableCell, styles.errorText]}>1</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Captopril</Text>
          <Text style={styles.tableCell}>8</Text>
          <Text style={[styles.tableCell, styles.errorText]}>2</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[24],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  summaryCard: {
    flex: 1,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[4],
    ...theme.elevation.card,
  },
  summaryLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  summaryValue: {
    ...theme.typography.heading.h3Regular,
    color: theme.colors.primaryBlue[500],
  },
  summaryHint: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textMuted,
  },
  errorText: {
    color: theme.colors.error[500],
  },
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  cardTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
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
    height: 8,
    borderRadius: theme.radius[8],
    backgroundColor: theme.colors.neutral[100],
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryBlue[500],
  },
  barPercent: {
    width: 30,
    textAlign: 'right',
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  tableRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
  },
  tableHead: {
    flex: 1,
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  tableCell: {
    flex: 1,
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
});
