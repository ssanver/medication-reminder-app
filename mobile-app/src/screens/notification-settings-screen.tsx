import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type NotificationSettingsScreenProps = {
  locale: Locale;
  notificationsEnabled: boolean;
  remindersEnabled: boolean;
  onNotificationsChange: (value: boolean) => void;
  onRemindersChange: (value: boolean) => void;
  onBack: () => void;
};

export function NotificationSettingsScreen({
  locale,
  notificationsEnabled,
  remindersEnabled,
  onNotificationsChange,
  onRemindersChange,
  onBack,
}: NotificationSettingsScreenProps) {
  const t = getTranslations(locale);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.notificationSettings} leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.group}>
        <View style={styles.row}>
          <View>
            <Text style={styles.title}>{t.appNotifications}</Text>
            <Text style={styles.subtitle}>{t.openMedicationReminders}</Text>
          </View>
          <Switch value={notificationsEnabled} onValueChange={onNotificationsChange} />
        </View>
        <View style={[styles.row, styles.divider]}>
          <View>
            <Text style={styles.title}>{t.medicationReminders}</Text>
            <Text style={styles.subtitle}>{t.dailyMedicationAlerts}</Text>
          </View>
          <Switch value={remindersEnabled} onValueChange={onRemindersChange} />
        </View>
      </View>

      {!notificationsEnabled ? <Text style={styles.warning}>{t.notificationPermissionRequired}</Text> : null}
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
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.divider,
  },
  title: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  subtitle: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  warning: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
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

