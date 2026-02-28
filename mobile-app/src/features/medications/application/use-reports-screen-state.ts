import { useMemo } from 'react';
import { type Locale } from '../../localization/localization';
import { getAdherenceSummary, getMedicationReport, getWeeklyTrend } from '../medication-store';
import { useMedicationStore } from '../use-medication-store';

export function useReportsScreenState(locale: Locale) {
  const store = useMedicationStore();

  const summary = useMemo(() => getAdherenceSummary(new Date()), [store.events, store.medications]);
  const weekly = useMemo(() => getWeeklyTrend(new Date(), locale), [locale, store.events, store.medications]);
  const medicationRows = useMemo(() => getMedicationReport(new Date()), [store.events, store.medications]);

  return {
    summary,
    weekly,
    medicationRows,
    eventCount: store.events.length,
  };
}
