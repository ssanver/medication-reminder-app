import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MedicationCard } from '../components/ui/medication-card';
import { localizeFormLabel, localizeFrequencyLabel } from '../features/localization/medication-localization';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { deleteMedication, resolveMedicationIcon, setMedicationActive } from '../features/medications/medication-store';
import { useMedicationStore } from '../features/medications/use-medication-store';
import { theme } from '../theme';

type MyMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  onOpenMedicationDetails: (medicationId: string) => void;
  onOpenAddMedication: () => void;
};

type MedStatus = 'All' | 'Active' | 'Inactive';

export function MyMedsScreen({ locale, fontScale, onOpenMedicationDetails, onOpenAddMedication }: MyMedsScreenProps) {
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

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>{locale === 'tr' ? 'İlacınız bulunmamaktadır.' : 'No medications found.'}</Text>
          <Pressable style={styles.emptyButton} onPress={onOpenAddMedication}>
            <Text style={styles.emptyButtonText}>{t.addMedication}</Text>
          </Pressable>
        </View>
      ) : (
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
              secondaryActionLabel={locale === 'tr' ? 'Sil' : 'Delete'}
              onSecondaryActionPress={() => {
                Alert.alert(
                  locale === 'tr' ? 'İlacı sil' : 'Delete medication',
                  locale === 'tr' ? 'Bu işlem geri alınamaz. Devam edilsin mi?' : 'This action cannot be undone. Continue?',
                  [
                    {
                      text: locale === 'tr' ? 'Vazgeç' : 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: locale === 'tr' ? 'Onayla' : 'Confirm',
                      style: 'destructive',
                      onPress: () => {
                        void (async () => {
                          try {
                            await deleteMedication(item.id);
                          } catch {
                            Alert.alert(
                              locale === 'tr' ? 'Silme başarısız' : 'Delete failed',
                              locale === 'tr' ? 'İlaç silinemedi. Lütfen tekrar deneyin.' : 'Medication could not be deleted. Please try again.',
                            );
                          }
                        })();
                      },
                    },
                  ],
                );
              }}
              onPress={() => onOpenMedicationDetails(item.id)}
            />
          ))}
        </View>
      )}

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
  emptyCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  emptyIcon: {
    fontSize: 20,
  },
  emptyTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  emptyButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing[16],
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.primaryBlue[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    ...theme.typography.bodyScale.mMedium,
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
