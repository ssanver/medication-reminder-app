import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/app-header';
import { EmptyState } from '../components/ui/empty-state';
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
            <View key={item.id} style={styles.card}>
              <Text
                style={{
                  ...theme.typography.bodyScale.mMedium,
                  fontSize: theme.typography.bodyScale.mMedium.fontSize * fontScale,
                  lineHeight: theme.typography.bodyScale.mMedium.lineHeight * fontScale,
                  color: theme.colors.semantic.textPrimary,
                }}
              >
                {item.name}
              </Text>
              <Text style={[styles.badge, item.status === 'Taken' ? styles.taken : styles.missed]}>{item.status}</Text>
            </View>
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
  card: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    padding: theme.spacing[16],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  badge: {
    ...theme.typography.captionScale.lRegular,
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.radius[8],
    overflow: 'hidden',
  },
  taken: {
    color: theme.colors.semantic.stateSuccess,
    backgroundColor: theme.colors.semantic.stateSuccessSoft,
  },
  missed: {
    color: theme.colors.semantic.stateError,
    backgroundColor: theme.colors.semantic.stateErrorSoft,
  },
});
