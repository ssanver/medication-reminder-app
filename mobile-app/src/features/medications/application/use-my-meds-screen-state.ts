import { useMemo, useState } from 'react';
import { localizeFormLabel, localizeFrequencyLabel } from '../../localization/medication-localization';
import { getLocaleTag, getTranslations, type Locale } from '../../localization/localization';
import { deleteMedication, getMedicationById, resolveMedicationIcon, setMedicationActive } from '../medication-store';
import { clearNotificationHistoryForMedication } from '../../notifications/notification-history';
import { clearMedicationReminderNotificationsForMedication } from '../../notifications/local-notifications';
import { useMedicationStore } from '../use-medication-store';
import { type MedicationListItem } from './my-meds-active-overrides';

export type MyMedsFilter = 'All' | 'Active' | 'Inactive';

type UseMyMedsScreenStateInput = {
  locale: Locale;
};

export function useMyMedsScreenState({ locale }: UseMyMedsScreenStateInput) {
  const t = getTranslations(locale);
  const store = useMedicationStore();
  const [filter, setFilter] = useState<MyMedsFilter>('All');
  const [pendingMedicationIds, setPendingMedicationIds] = useState<Record<string, boolean>>({});

  const takenCountsByMedication = useMemo(() => {
    return store.events.reduce<Record<string, number>>((acc, item) => {
      if (item.status !== 'taken') {
        return acc;
      }
      acc[item.medicationId] = (acc[item.medicationId] ?? 0) + 1;
      return acc;
    }, {});
  }, [store.events]);

  const baseItems = useMemo<MedicationListItem[]>(
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
        const mealLabel = item.isBeforeMeal ? t.beforeMeal : t.afterMeal;
        const takenCount = takenCountsByMedication[item.id] ?? 0;
        const remainingCount =
          typeof item.totalQuantity === 'number' && item.totalQuantity > 0 ? Math.max(item.totalQuantity - takenCount, 0) : null;

        return {
          id: item.id,
          name: item.name,
          details: `${frequencyLabel} | ${item.dosage} ${formLabel} | ${mealLabel}`,
          schedule:
            remainingCount === null
              ? t.startedOn.replace('{{date}}', startedLabel)
              : t.startedOnWithRemaining.replace('{{date}}', startedLabel).replace('{{count}}', `${remainingCount}`),
          active: item.active,
          emoji: icon,
        };
      }),
    [locale, store.medications, t.afterMeal, t.beforeMeal, t.startedOn, t.startedOnWithRemaining, takenCountsByMedication],
  );

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return baseItems;
    }

    return baseItems.filter((item) => (filter === 'Active' ? item.active : !item.active));
  }, [baseItems, filter]);

  const counts = useMemo(
    () => ({
      all: baseItems.length,
      active: baseItems.filter((item) => item.active).length,
      inactive: baseItems.filter((item) => !item.active).length,
    }),
    [baseItems],
  );

  async function removeMedication(medicationId: string) {
    try {
      await deleteMedication(medicationId);
      await clearMedicationReminderNotificationsForMedication(medicationId);
      await clearNotificationHistoryForMedication(medicationId);
      return null;
    } catch {
      return t.medicationDeleteError;
    }
  }

  async function toggleMedicationActive(medicationId: string, active: boolean) {
    setPendingMedicationIds((current) => ({
      ...current,
      [medicationId]: true,
    }));

    try {
      await setMedicationActive(medicationId, active);
      const updatedMedication = getMedicationById(medicationId);
      if (updatedMedication?.active !== active) {
        throw new Error('Medication active state is still out of sync after the backend response.');
      }
    } finally {
      setPendingMedicationIds((current) => {
        const next = { ...current };
        delete next[medicationId];
        return next;
      });
    }
  }

  return {
    filter,
    setFilter,
    filtered,
    counts,
    isMedicationPending: (medicationId: string) => pendingMedicationIds[medicationId] === true,
    removeMedication,
    toggleMedicationActive,
  };
}
