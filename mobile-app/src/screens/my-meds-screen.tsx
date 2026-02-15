import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/app-header';
import { EmptyState } from '../components/ui/empty-state';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type MyMedsScreenProps = {
  locale: Locale;
  fontScale: number;
};

type MedStatus = 'All' | 'Active' | 'Inactive';

export function MyMedsScreen({ locale, fontScale }: MyMedsScreenProps) {
  const t = getTranslations(locale);
  const [filter, setFilter] = useState<MedStatus>('All');
  const [items, setItems] = useState([
    { id: '1', name: 'Parol 500mg', active: true },
    { id: '2', name: 'Aferin 200mg', active: false },
  ]);

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return items;
    }

    return items.filter((item) => (filter === 'Active' ? item.active : !item.active));
  }, [items, filter]);

  return (
    <View style={styles.container}>
      <AppHeader title={t.myMeds} subtitle="Aktif ve pasif ilaclar" />
      <SegmentedControl options={['All', 'Active', 'Inactive']} value={filter} onChange={(v) => setFilter(v as MedStatus)} />

      {filtered.length === 0 ? (
        <EmptyState
          title="Ilac bulunamadi"
          description="Bu filtrede goruntulenecek ilac yok."
          ctaLabel="Tumunu goster"
          onPress={() => setFilter('All')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <View key={item.id} style={[styles.card, !item.active && styles.cardInactive]}>
              <Text
                style={{
                  ...theme.typography.body,
                  fontSize: theme.typography.body.fontSize * fontScale,
                  lineHeight: theme.typography.body.lineHeight * fontScale,
                  color: theme.colors.semantic.textPrimary,
                }}
              >
                {item.name}
              </Text>
              <Switch
                value={item.active}
                onValueChange={(value) =>
                  setItems((prev) => prev.map((current) => (current.id === item.id ? { ...current, active: value } : current)))
                }
              />
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
  list: {
    gap: theme.spacing[16],
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    padding: theme.spacing[16],
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInactive: {
    opacity: 0.55,
  },
});
