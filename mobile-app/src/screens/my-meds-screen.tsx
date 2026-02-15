import { Text, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type MyMedsScreenProps = {
  locale: Locale;
};

export function MyMedsScreen({ locale }: MyMedsScreenProps) {
  const t = getTranslations(locale);

  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>{t.myMeds}</Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Aktif ve pasif ilac kartlari bu ekranda olacak.
      </Text>
    </View>
  );
}
