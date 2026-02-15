import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/app-header';
import { fontScaleLevels } from '../features/accessibility/accessibility-settings';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type SettingsScreenProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  fontScale: number;
  onFontScaleChange: (fontScale: number) => void;
  onOpenReports: () => void;
  onOpenProfile: () => void;
};

export function SettingsScreen({
  locale,
  onLocaleChange,
  fontScale,
  onFontScaleChange,
  onOpenReports,
  onOpenProfile,
}: SettingsScreenProps) {
  const t = getTranslations(locale);

  return (
    <View style={styles.container}>
      <AppHeader title={t.settings} subtitle="Dil, bildirim ve erisilebilirlik" />

      <View style={styles.group}>
        <Text style={styles.label}>{t.languageTitle}</Text>
        <View style={styles.row}>
          <Pressable onPress={() => onLocaleChange('tr')} style={[styles.chip, locale === 'tr' && styles.chipActive]}>
            <Text style={styles.chipText}>TR</Text>
          </Pressable>
          <Pressable onPress={() => onLocaleChange('en')} style={[styles.chip, locale === 'en' && styles.chipActive]}>
            <Text style={styles.chipText}>EN</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Display zoom</Text>
        <View style={styles.row}>
          {fontScaleLevels.map((level) => {
            const selected = level === fontScale;
            return (
              <Pressable key={level} onPress={() => onFontScaleChange(level)} style={[styles.chip, selected && styles.chipActive]}>
                <Text style={styles.chipText}>{`${Math.round(level * 100)}%`}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Kisa yollar</Text>
        <Pressable style={styles.linkRow} onPress={onOpenReports}>
          <Text style={styles.linkText}>Raporlar</Text>
          <Text style={styles.linkArrow}>{'>'}</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={onOpenProfile}>
          <Text style={styles.linkText}>Profil</Text>
          <Text style={styles.linkArrow}>{'>'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[24],
  },
  group: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  label: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.radius[8],
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
  },
  chipActive: {
    borderColor: theme.colors.semantic.brandPrimary,
    backgroundColor: theme.colors.primaryBlue[50],
  },
  chipText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  linkRow: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    paddingHorizontal: theme.spacing[16],
    backgroundColor: theme.colors.neutral[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  linkArrow: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
});
