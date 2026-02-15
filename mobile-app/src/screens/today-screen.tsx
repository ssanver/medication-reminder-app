import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { MedicationCard } from '../components/ui/medication-card';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type TodayScreenProps = {
  locale: Locale;
  fontScale: number;
};

type DoseStatus = 'All' | 'Taken' | 'Missed';

type DoseItem = {
  id: string;
  name: string;
  details: string;
  schedule: string;
  status: 'taken' | 'missed' | 'pending';
  emoji: string;
};

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const weekDates = ['21', '22', '23', '24', '25', '26', '27'];

const doses: DoseItem[] = [
  { id: '1', name: 'Metformin', details: '1 Capsules', schedule: '09:00 | Daily', status: 'pending', emoji: '💊' },
  { id: '2', name: 'Captopril', details: '2 Capsules', schedule: '20:00 | Daily', status: 'pending', emoji: '🧴' },
  { id: '3', name: 'B 12', details: '1 Injection', schedule: '22:00 | Daily', status: 'taken', emoji: '💉' },
  { id: '4', name: 'I-DROP MGD', details: '2 Drops', schedule: '22:00 | Daily', status: 'missed', emoji: '🫙' },
  { id: '5', name: 'Niacin', details: '0.5 Pill', schedule: '22:00 | Daily', status: 'pending', emoji: '🧪' },
];

export function TodayScreen({ locale, fontScale }: TodayScreenProps) {
  const t = getTranslations(locale);
  const [filter, setFilter] = useState<DoseStatus>('All');

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return doses;
    }

    const map = {
      Taken: 'taken',
      Missed: 'missed',
    } as const;

    return doses.filter((item) => item.status === map[filter]);
  }, [filter]);

  const counts = useMemo(
    () => ({
      all: doses.length,
      taken: doses.filter((item) => item.status === 'taken').length,
      missed: doses.filter((item) => item.status === 'missed').length,
    }),
    [],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileRow}>
        <View style={styles.avatar}><Text style={styles.avatarEmoji}>👩</Text></View>
        <View>
          <Text style={styles.hello}>Hello, Hanie</Text>
          <Text style={styles.welcome}>Welcome !</Text>
        </View>
      </View>

      <Text style={[styles.dateTitle, { fontSize: theme.typography.bodyScale.mRegular.fontSize * fontScale }]}>Today , July 25</Text>
      <View style={styles.calendarStrip}>
        <Text style={styles.arrow}>{'<'}</Text>
        {weekDays.map((day, index) => {
          const active = weekDates[index] === '25';
          return (
            <View key={`${day}-${index}`} style={[styles.dayCell, active && styles.dayCellActive]}>
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
              <Text style={[styles.dayDate, active && styles.dayTextActive]}>{weekDates[index]}</Text>
            </View>
          );
        })}
        <Text style={styles.arrow}>{'>'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Today's Medication</Text>
      <SegmentedControl
        options={[
          { label: 'All', value: 'All', count: counts.all },
          { label: 'Taken', value: 'Taken', count: counts.taken },
          { label: 'Missed', value: 'Missed', count: counts.missed },
        ]}
        value={filter}
        onChange={(next) => setFilter(next as DoseStatus)}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No Medications are Scheduled for this day</Text>
          <Text style={styles.emptyDescription}>If you haven't added a medication, please do so now.</Text>
          <Button label="+ Add Medication" onPress={() => setFilter('All')} />
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <MedicationCard
              key={item.id}
              name={item.name}
              details={item.details}
              schedule={item.schedule}
              actionLabel={item.status === 'taken' ? 'Taken' : 'Take'}
              actionVariant={item.status === 'taken' ? 'success' : item.status === 'missed' ? 'danger' : 'filled'}
              statusBadge={item.status === 'missed' ? 'missed' : item.status === 'pending' ? 'ontime' : undefined}
              showAction
              medEmoji={item.emoji}
            />
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
      <Text style={styles.hidden}>{t.today}</Text>
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
    paddingBottom: theme.spacing[16],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryBlue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  hello: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  welcome: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dateTitle: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  calendarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
  },
  arrow: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dayCell: {
    width: 28,
    borderRadius: theme.radius[8],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellActive: {
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  dayText: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dayDate: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  dayTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  sectionTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  list: {
    gap: theme.spacing[16],
  },
  emptyCard: {
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderColor: theme.colors.semantic.borderSoft,
    borderWidth: 1,
    padding: theme.spacing[16],
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  emptyDescription: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
});
