import { useEffect, useState } from 'react';
import { type Locale } from '../../localization/localization';
import { getDoseReport } from '../medication-store';
import { useMedicationStore } from '../use-medication-store';

export function useReportsScreenState(locale: Locale) {
  const store = useMedicationStore();
  const [summary, setSummary] = useState({ adherence: 0, totalScheduled: 0, taken: 0, missed: 0 });
  const [weekly, setWeekly] = useState<Array<{ label: string; value: number }>>([]);
  const [medicationRows, setMedicationRows] = useState<Array<{ medication: string; taken: number; missed: number }>>([]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const report = await getDoseReport(new Date(), locale);
        if (!isMounted) {
          return;
        }
        setSummary(report.summary);
        setWeekly(report.weekly);
        setMedicationRows(report.medicationRows);
      } catch {
        if (!isMounted) {
          return;
        }
        setSummary({ adherence: 0, totalScheduled: 0, taken: 0, missed: 0 });
        setWeekly([]);
        setMedicationRows([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, store.events, store.medications]);

  return {
    summary,
    weekly,
    medicationRows,
    eventCount: store.events.length,
  };
}
