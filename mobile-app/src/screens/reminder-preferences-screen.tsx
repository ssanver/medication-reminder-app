import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type ReminderPreferencesScreenProps = {
  locale: Locale;
  snoozeMinutes: number;
  onSnoozeMinutesChange: (value: number) => void;
  onBack: () => void;
};

const snoozeOptions = [5, 10, 15, 20];

export function ReminderPreferencesScreen({ locale, snoozeMinutes, onSnoozeMinutesChange, onBack }: ReminderPreferencesScreenProps) {
  const t = getTranslations(locale);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.reminderPreferences} leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.group}>
        <Text style={styles.label}>{t.snoozeDuration}</Text>
        <View style={styles.optionsRow}>
          {snoozeOptions.map((option) => {
            const selected = option === snoozeMinutes;
            return (
              <Pressable
                key={option}
                style={[styles.option, selected && styles.optionActive]}
                onPress={() => onSnoozeMinutesChange(option)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextActive]}>{`${option} min`}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.doneBtn} onPress={onBack}>
        <Text style={styles.doneText}>{t.done}</Text>
      </Pressable>
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
  group: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  label: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  option: {
    minHeight: 36,
    minWidth: 66,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  optionActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  optionText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  doneBtn: {
    minHeight: 44,
    borderRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryBlue[500],
  },
  doneText: {
    ...theme.typography.button.mMedium,
    color: '#FFFFFF',
  },
});

