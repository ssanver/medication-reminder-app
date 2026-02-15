import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getAdherenceSummary, getMedicationReport, getWeeklyTrend } from '../features/medications/medication-store';
import { useMedicationStore } from '../features/medications/use-medication-store';
import { theme } from '../theme';

type ReportsScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function ReportsScreen({ locale, onBack }: ReportsScreenProps) {
  const t = getTranslations(locale);
  const store = useMedicationStore();
  const summary = getAdherenceSummary(new Date());
  const weekly = getWeeklyTrend(new Date(), locale);
  const medicationRows = getMedicationReport(new Date());

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t.reportsTitle}
        subtitle={t.reportsSubtitle}
        leftAction={{ icon: '<', onPress: onBack }}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.adherence}</Text>
          <Text style={styles.summaryValue}>{`${summary.adherence}%`}</Text>
          <Text style={styles.summaryHint}>
            {`${summary.taken} / ${summary.totalScheduled} ${t.taken.toLowerCase()}`}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.missedColumn}</Text>
          <Text style={[styles.summaryValue, styles.errorText]}>{summary.missed}</Text>
          <Text style={styles.summaryHint}>{t.last7Days}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.weeklyTrend}</Text>
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
        <Text style={styles.cardTitle}>{t.medicationReport}</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tableHead}>{t.medicationColumn}</Text>
          <Text style={styles.tableHead}>{t.takenColumn}</Text>
          <Text style={styles.tableHead}>{t.missedColumn}</Text>
        </View>
        {medicationRows.map((row) => (
          <View key={row.medication} style={styles.tableRow}>
            <Text style={styles.tableCell}>{row.medication}</Text>
            <Text style={styles.tableCell}>{row.taken}</Text>
            <Text style={[styles.tableCell, styles.errorText]}>{row.missed}</Text>
          </View>
        ))}
        {medicationRows.length === 0 ? <Text style={styles.summaryHint}>{t.noReportData}</Text> : null}
      </View>
      <Text style={styles.hidden}>{store.events.length}</Text>
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
  hidden: {
    opacity: 0,
    height: 0,
  },
});
