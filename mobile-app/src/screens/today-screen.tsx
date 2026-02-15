import { Text, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type TodayScreenProps = {
  locale: Locale;
  fontScale: number;
};

export function TodayScreen({ locale, fontScale }: TodayScreenProps) {
  const t = getTranslations(locale);

  return (
    <View>
      <Text
        style={{
          ...theme.typography.heading5,
          fontSize: theme.typography.heading5.fontSize * fontScale,
          lineHeight: theme.typography.heading5.lineHeight * fontScale,
          color: theme.colors.semantic.textPrimary,
        }}
      >
        {t.today}
      </Text>
      <Text
        style={{
          ...theme.typography.body,
          fontSize: theme.typography.body.fontSize * fontScale,
          lineHeight: theme.typography.body.lineHeight * fontScale,
          color: theme.colors.semantic.textSecondary,
        }}
      >
        Ilac hatirlatmalari burada listelenecek.
      </Text>
    </View>
  );
}
