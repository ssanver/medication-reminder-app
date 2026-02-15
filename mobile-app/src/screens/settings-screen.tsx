import { Pressable, Text, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type SettingsScreenProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
};

export function SettingsScreen({ locale, onLocaleChange }: SettingsScreenProps) {
  const t = getTranslations(locale);

  return (
    <View style={{ gap: theme.spacing[16] }}>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>{t.settings}</Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Dil, bildirim ve erisilebilirlik ayarlari bu ekranda yonetilecek.
      </Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textPrimary }}>{t.languageTitle}</Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing[8] }}>
        <Pressable
          onPress={() => onLocaleChange('tr')}
          style={{ borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: theme.radius[8], padding: 8 }}
        >
          <Text>TR</Text>
        </Pressable>
        <Pressable
          onPress={() => onLocaleChange('en')}
          style={{ borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: theme.radius[8], padding: 8 }}
        >
          <Text>EN</Text>
        </Pressable>
      </View>
    </View>
  );
}
