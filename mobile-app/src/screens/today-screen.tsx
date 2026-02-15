import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/app-header';
import { EmptyState } from '../components/ui/empty-state';
import { MedicationCard } from '../components/ui/medication-card';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type TodayScreenProps = {
  locale: Locale;
  fontScale: number;
};

type DoseStatus = 'All' | 'Taken' | 'Missed';

const mockData = [
  { id: '1', name: 'Parol 500mg', status: 'Taken' },
  { id: '2', name: 'Aferin 200mg', status: 'Missed' },
];

export function TodayScreen({ locale, fontScale }: TodayScreenProps) {
  const t = getTranslations(locale);
  const [filter, setFilter] = useState<DoseStatus>('All');

  const list = useMemo(() => {
    if (filter === 'All') {
      return mockData;
    }

    return mockData.filter((item) => item.status === filter);
  }, [filter]);

  return (
    <View style={styles.container}>
      <AppHeader title={t.today} subtitle="Gunluk planlanan dozlar" />
      <SegmentedControl options={['All', 'Taken', 'Missed']} value={filter} onChange={(v) => setFilter(v as DoseStatus)} />

      {list.length === 0 ? (
        <EmptyState
          title="Kayit yok"
          description="Bu filtrede goruntulenecek doz kaydi bulunmuyor."
          ctaLabel="Filtreyi sifirla"
          onPress={() => setFilter('All')}
        />
      ) : (
        <View style={styles.cardList}>
          {list.map((item) => (
            <MedicationCard
              key={item.id}
              name={item.name}
              details="1 Capsules"
              schedule="09:00 | Daily"
              actionLabel={item.status === 'Taken' ? 'Taken' : 'Take'}
              actionVariant={item.status === 'Taken' ? 'success' : 'filled'}
              showAction
              onActionPress={() => undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardList: {
    gap: theme.spacing[16],
  },
});
