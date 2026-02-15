import { Text, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type TodayScreenProps = {
  locale: Locale;
};

export function TodayScreen({ locale }: TodayScreenProps) {
  const t = getTranslations(locale);

  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>{t.today}</Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Ilac hatirlatmalari burada listelenecek.
      </Text>
    </View>
  );
}
