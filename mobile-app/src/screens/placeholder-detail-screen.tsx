import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type PlaceholderDetailScreenProps = {
  locale: Locale;
  title: string;
  description: string;
  items?: string[];
  onBack: () => void;
};

export function PlaceholderDetailScreen({ locale, title, description, items = [], onBack }: PlaceholderDetailScreenProps) {
  const t = getTranslations(locale);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={title} leftAction={{ icon: '<', onPress: onBack }} />

      <Text style={styles.description}>{description}</Text>

      <View style={styles.group}>
        {items.map((item, index) => (
          <View key={item} style={[styles.row, index < items.length - 1 && styles.rowDivider]}>
            <Text style={styles.rowTitle}>{item}</Text>
            <Text style={styles.chevron}>{'>'}</Text>
          </View>
        ))}
        {items.length === 0 ? <Text style={styles.empty}>{t.noDetailsAvailable}</Text> : null}
      </View>
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
  description: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  group: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    overflow: 'hidden',
  },
  row: {
    minHeight: 50,
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
  },
  rowTitle: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  chevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  empty: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textMuted,
    padding: theme.spacing[16],
  },
});
