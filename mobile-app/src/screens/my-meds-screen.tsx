import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MedicationCard } from '../components/ui/medication-card';
import { SegmentedControl } from '../components/ui/segmented-control';
import { type Locale } from '../features/localization/localization';
import { setMedicationActive } from '../features/medications/medication-store';
import { useMedicationStore } from '../features/medications/use-medication-store';
import { theme } from '../theme';

type MyMedsScreenProps = {
  locale: Locale;
  fontScale: number;
};

type MedStatus = 'All' | 'Active' | 'Inactive';

export function MyMedsScreen({ locale, fontScale }: MyMedsScreenProps) {
  const store = useMedicationStore();
  const t = locale === 'tr' ? {
    title: 'Ilaclarim',
    all: 'Tum',
    active: 'Aktif',
    inactive: 'Pasif',
  } : {
    title: 'My medication',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
  };
  const [filter, setFilter] = useState<MedStatus>('All');

  const items = useMemo(
    () =>
      store.medications.map((item) => {
        const detailsUnit = item.form.toLowerCase() === 'drop' ? 'Drops' : item.form.toLowerCase() === 'injection' ? 'Injection' : 'Capsules';
        const icon = item.form.toLowerCase() === 'drop' ? '🫙' : item.form.toLowerCase() === 'injection' ? '💉' : item.form.toLowerCase() === 'pill' ? '💊' : '🧴';

        return {
          id: item.id,
          name: item.name,
          details: `${item.frequencyLabel} | ${item.dosage} ${detailsUnit}`,
          remaining: `Started ${item.startDate} | 10 Capsules remain`,
          active: item.active,
          emoji: icon,
        };
      }),
    [store.medications],
  );

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return items;
    }

    return items.filter((item) => (filter === 'Active' ? item.active : !item.active));
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((item) => item.active).length,
      inactive: items.filter((item) => !item.active).length,
    }),
    [items],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { fontSize: theme.typography.heading.h4Medium.fontSize * fontScale }]}>{t.title}</Text>

      <SegmentedControl
        options={[
          { label: t.all, value: 'All', count: counts.all },
          { label: t.active, value: 'Active', count: counts.active },
          { label: t.inactive, value: 'Inactive', count: counts.inactive },
        ]}
        value={filter}
        onChange={(next) => setFilter(next as MedStatus)}
      />

      <View style={styles.list}>
        {filtered.map((item) => (
          <MedicationCard
            key={item.id}
            name={item.name}
            details={item.details}
            schedule={item.remaining}
            active={item.active}
            showToggle
            medEmoji={item.emoji}
            onToggle={(value) =>
              void setMedicationActive(item.id, value)
            }
          />
        ))}
      </View>

      <View style={styles.bottomSpacer} />
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
  title: {
    ...theme.typography.heading.h4Medium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[8],
  },
  list: {
    gap: theme.spacing[16],
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
