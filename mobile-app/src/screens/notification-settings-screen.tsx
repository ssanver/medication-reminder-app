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
      <View style={styles.topSection}>
        <ScreenHeader title={t.notificationSettings} leftAction={{ icon: 'back', onPress: onBack }} />

        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.textBlock}>
              <Text style={styles.title}>{t.appNotifications}</Text>
              <Text style={styles.subtitle}>{t.openMedicationReminders}</Text>
            </View>
            <View style={styles.switchWrap}>
              <Switch value={notificationsEnabled} onValueChange={onNotificationsChange} />
            </View>
          </View>
          <View style={[styles.row, styles.divider]}>
            <View style={styles.textBlock}>
              <Text style={styles.title}>{t.medicationReminders}</Text>
              <Text style={styles.subtitle}>{t.dailyMedicationAlerts}</Text>
            </View>
            <View style={styles.switchWrap}>
              <Switch value={remindersEnabled} onValueChange={onRemindersChange} />
            </View>
          </View>
        </View>

        {!notificationsEnabled ? <Text style={styles.warning}>{t.notificationPermissionRequired}</Text> : null}
      </View>

      <Pressable testID="notification-settings-done-button" style={styles.doneBtn} onPress={onBack}>
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
    flexGrow: 1,
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[24],
  },
  topSection: {
    gap: theme.spacing[16],
  },
  group: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  textBlock: {
    flex: 1,
    paddingRight: theme.spacing[8],
    justifyContent: 'center',
  },
  switchWrap: {
    justifyContent: 'center',
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
    marginTop: 'auto',
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
