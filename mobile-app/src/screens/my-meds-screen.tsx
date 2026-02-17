import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MedicationCard } from '../components/ui/medication-card';
import { localizeFormLabel, localizeFrequencyLabel } from '../features/localization/medication-localization';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { resolveMedicationIcon, setMedicationActive } from '../features/medications/medication-store';
import { useMedicationStore } from '../features/medications/use-medication-store';
import { theme } from '../theme';

type MyMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  onOpenMedicationDetails: (medicationId: string) => void;
};

type MedStatus = 'All' | 'Active' | 'Inactive';

export function MyMedsScreen({ locale, fontScale, onOpenMedicationDetails }: MyMedsScreenProps) {
  const store = useMedicationStore();
  const t = getTranslations(locale);
  const [filter, setFilter] = useState<MedStatus>('All');

  const items = useMemo(
    () =>
      store.medications.map((item) => {
        const icon = resolveMedicationIcon(item.form, item.iconEmoji);
        const startedAt = new Date(`${item.startDate}T00:00:00`);
        const startedLabel = Number.isNaN(startedAt.getTime())
          ? item.startDate
          : startedAt.toLocaleDateString(getLocaleTag(locale), {
              day: 'numeric',
              month: 'long',
            });

        const formLabel = localizeFormLabel(item.form, locale);
        const frequencyLabel = localizeFrequencyLabel(item.frequencyLabel, locale);

        return {
          id: item.id,
          name: item.name,
          details:
            locale === 'tr'
              ? `${frequencyLabel} | ${item.dosage} ${formLabel}`
              : `${frequencyLabel} | ${item.dosage} ${formLabel}`,
          schedule: locale === 'tr' ? `${startedLabel} başlangıç | 10 ${formLabel.toLowerCase()} kaldı` : `Started ${startedLabel} | 10 ${formLabel}s remain`,
          active: item.active,
          emoji: icon,
        };
      }),
    [store.medications, locale],
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
      <Text style={[styles.title, { fontSize: theme.typography.heading.h4Medium.fontSize * fontScale }]}>{t.myMedicationTitle}</Text>

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
            schedule={item.schedule}
            active={item.active}
            showToggle
            compact
            medEmoji={item.emoji}
            onToggle={(value) => void setMedicationActive(item.id, value)}
            onPress={() => onOpenMedicationDetails(item.id)}
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
    paddingTop: theme.spacing[8],
    paddingBottom: theme.spacing[16],
  },
  title: {
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  list: {
    gap: theme.spacing[16],
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
