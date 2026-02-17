import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { fontScaleLevels } from '../features/accessibility/accessibility-settings';
import { getLocaleOptions, getTranslations, type Locale } from '../features/localization/localization';
import { toShortDisplayName } from '../features/profile/display-name';
import { theme } from '../theme';

type SettingsScreenProps = {
  locale: Locale;
  fontScale: number;
  onSaveAppearance: (locale: Locale, fontScale: number) => void;
  onOpenReports: () => void;
  onOpenProfile: () => void;
  onOpenNotificationSettings: () => void;
  onOpenReminderPreferences: () => void;
  onOpenChangePassword: () => void;
  onOpenFeedback: () => void;
  onOpenAboutUs: () => void;
  onLogout: () => void;
  notificationsEnabled: boolean;
  medicationRemindersEnabled: boolean;
  snoozeMinutes: number;
  onNotificationsToggle: (value: boolean) => void;
  onMedicationRemindersToggle: (value: boolean) => void;
  onEnableNotifications: () => void;
};

export function SettingsScreen({
  locale,
  fontScale,
  onSaveAppearance,
  onOpenReports,
  onOpenProfile,
  onOpenNotificationSettings,
  onOpenReminderPreferences,
  onOpenChangePassword,
  onOpenFeedback,
  onOpenAboutUs,
  onLogout,
  notificationsEnabled,
  medicationRemindersEnabled,
  snoozeMinutes,
  onNotificationsToggle,
  onMedicationRemindersToggle,
  onEnableNotifications,
}: SettingsScreenProps) {
  const t = getTranslations(locale);
  const shortDisplayName = toShortDisplayName('Suleyman Şanver');
  const localeOptions = getLocaleOptions(locale);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [draftLocale, setDraftLocale] = useState<Locale>(locale);
  const [draftFontScale, setDraftFontScale] = useState(fontScale);

  useEffect(() => {
    setDraftLocale(locale);
  }, [locale]);

  useEffect(() => {
    setDraftFontScale(fontScale);
  }, [fontScale]);

  const isAppearanceDirty = draftLocale !== locale || draftFontScale !== fontScale;

  const version = useMemo(() => {
    const expoVersion = Constants.expoConfig?.version ?? '1.0.0';
    const iosBuild = Constants.expoConfig?.ios?.buildNumber;
    const androidBuild = Constants.expoConfig?.android?.versionCode;
    const buildMeta = iosBuild ?? (typeof androidBuild === 'number' ? `${androidBuild}` : 'dev');
    return `Version ${expoVersion} (${buildMeta})`;
  }, []);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.settings} />

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>👩</Text></View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{`${t.hello}, ${shortDisplayName}`}</Text>
            <Pressable onPress={onOpenProfile}>
              <Text style={styles.editLink}>{t.editProfile}</Text>
            </Pressable>
          </View>
        </View>

        <Section title={t.reminderAlarm}>
          <MenuRow label={t.notificationSettings} value={t.defaultAppSound} onPress={onOpenNotificationSettings} />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.rowTitle}>{t.appNotifications}</Text>
              <Text style={styles.rowSubtitle}>{t.openMedicationReminders}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                if (value) {
                  await onEnableNotifications();
                  return;
                }

                onNotificationsToggle(false);
                onMedicationRemindersToggle(false);
              }}
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.rowTitle}>{t.medicationReminders}</Text>
              <Text style={styles.rowSubtitle}>{t.dailyMedicationAlerts}</Text>
            </View>
            <Switch
              value={medicationRemindersEnabled}
              onValueChange={async (value) => {
                if (value && !notificationsEnabled) {
                  await onEnableNotifications();
                  return;
                }

                onMedicationRemindersToggle(value);
              }}
            />
          </View>
          <MenuRow label={t.snoozeDuration} value={`${snoozeMinutes} min`} onPress={onOpenReminderPreferences} />
        </Section>

        <Section title={t.general}>
          <View style={styles.languageBlock}>
            <Text style={styles.rowTitle}>{t.language}</Text>
            <Pressable style={styles.languageCombo} onPress={() => setLanguagePickerOpen(true)}>
              <Text style={styles.languageText}>{localeOptions.find((item) => item.code === draftLocale)?.label ?? draftLocale}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.zoomBlock}>
            <Text style={styles.rowTitle}>{t.displayZoom}</Text>
            <View style={styles.zoomRow}>
              {fontScaleLevels.map((level) => {
                const selected = level === draftFontScale;
                return (
                  <Pressable key={level} onPress={() => setDraftFontScale(level)} style={[styles.zoomChip, selected && styles.zoomChipActive]}>
                    <Text style={[styles.zoomText, selected && styles.zoomTextActive]}>{`${Math.round(level * 100)}%`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={t.save}
              onPress={() => onSaveAppearance(draftLocale, draftFontScale)}
              disabled={!isAppearanceDirty}
              size="s"
            />
          </View>
        </Section>

        <Section title={t.reporting}>
          <MenuRow label={t.reports} value={t.weeklyMonthly} onPress={onOpenReports} />
          <MenuRow label={t.changePassword} onPress={onOpenChangePassword} />
          <MenuRow label={locale === 'tr' ? 'Bize Yazın' : 'Contact Us'} onPress={onOpenFeedback} />
          <Pressable style={styles.logoutRow} onPress={() => setLogoutConfirmVisible(true)}>
            <Text style={styles.logoutText}>{locale === 'tr' ? 'Çıkış Yap' : 'Log Out'}</Text>
          </Pressable>
        </Section>

        <Section title={t.aboutUs}>
          <MenuRow label={t.appInfo} value={version} onPress={onOpenAboutUs} />
        </Section>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal transparent visible={languagePickerOpen} animationType="slide" onRequestClose={() => setLanguagePickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setLanguagePickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{t.selectLanguage}</Text>
            {localeOptions.map((option) => {
              const selected = draftLocale === option.code;
              return (
                <Pressable
                  key={option.code}
                  style={[styles.languageOption, selected && styles.languageOptionActive]}
                  onPress={() => {
                    setDraftLocale(option.code);
                    setLanguagePickerOpen(false);
                  }}
                >
                  <Text style={[styles.languageOptionText, selected && styles.languageOptionTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={logoutConfirmVisible} animationType="fade" onRequestClose={() => setLogoutConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{locale === 'tr' ? 'Çıkış yapmak istediğinize emin misiniz?' : 'Are you sure you want to log out?'}</Text>
            <View style={styles.confirmActions}>
              <Button label={locale === 'tr' ? 'İptal' : 'Cancel'} variant="outlined" onPress={() => setLogoutConfirmVisible(false)} />
              <Button
                label={locale === 'tr' ? 'Çıkış Yap' : 'Log Out'}
                variant="danger"
                onPress={() => {
                  setLogoutConfirmVisible(false);
                  onLogout();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

type MenuRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
};

function MenuRow({ label, value, onPress }: MenuRowProps) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress} disabled={!onPress}>
      <View>
        <Text style={styles.rowTitle}>{label}</Text>
        {value ? <Text style={styles.rowSubtitle}>{value}</Text> : null}
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
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
  profileCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryBlue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  profileInfo: {
    gap: 2,
  },
  profileName: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  editLink: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
  },
  sectionWrap: {
    gap: theme.spacing[4],
  },
  sectionTitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  group: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    overflow: 'hidden',
    ...theme.elevation.card,
  },
  menuRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageBlock: {
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[8],
    paddingBottom: theme.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
    gap: theme.spacing[8],
  },
  languageCombo: {
    minHeight: 40,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[8],
  },
  languageText: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textPrimary,
  },
  zoomBlock: {
    gap: theme.spacing[8],
    padding: theme.spacing[16],
  },
  logoutRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoutText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.error[500],
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[24],
  },
  confirmCard: {
    width: '100%',
    borderRadius: theme.radius[16],
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    padding: theme.spacing[16],
    gap: theme.spacing[16],
  },
  confirmTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  confirmActions: {
    gap: theme.spacing[8],
  },
  rowTitle: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  rowSubtitle: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  chevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  zoomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  zoomChip: {
    minWidth: 64,
    height: 30,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  zoomChipActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  zoomText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  zoomTextActive: {
    color: theme.colors.primaryBlue[500],
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.semantic.overlay,
  },
  sheet: {
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    backgroundColor: theme.colors.semantic.cardBackground,
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[16],
    gap: theme.spacing[8],
  },
  sheetTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  languageOption: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  languageOptionActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  languageOptionText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  languageOptionTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
