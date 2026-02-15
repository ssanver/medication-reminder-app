import { Text, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
};

export function AddMedsScreen({ locale }: AddMedsScreenProps) {
  const t = getTranslations(locale);

  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>{t.addMeds}</Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Wizard adimlari bu ekranda uygulanacak.
      </Text>
    </View>
  );
}
