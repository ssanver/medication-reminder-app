import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { TextField } from '../components/ui/text-field';
import { loadAppDefinitions } from '../features/definitions/definitions-service';
import { fontScaleLevels } from '../features/accessibility/accessibility-settings';
import { getLocaleOptions, getTranslations, type Locale } from '../features/localization/localization';
import { activateAdFreeMode, getAdFreeStatus, type SubscriptionOffer, subscribeAdFreeStatus } from '../features/monetization/subscription-service';
import { useSettingsScreenState } from '../features/settings/application/use-settings-screen-state';
import { theme } from '../theme';

type SettingsScreenProps = {
  locale: Locale;
  fontScale: number;
  weekStartsOn: 'monday' | 'sunday';
  onSaveAppearance: (locale: Locale, fontScale: number, weekStartsOn: 'monday' | 'sunday') => void;
  onOpenProfile: () => void;
  onOpenSignUp: () => void;
  onOpenNotificationSettings: () => void;
  onOpenChangePassword: () => void;
  onOpenFeedback: () => void;
  onLogout: () => void;
  onShareApp: () => void;
  onOpenDonate: () => void;
  isGuestMode: boolean;
  onCancelAccount: (password: string) => Promise<{ ok: boolean; message: string }>;
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
  weekStartsOn,
  onSaveAppearance,
  onOpenProfile,
  onOpenSignUp,
  onOpenNotificationSettings,
  onOpenChangePassword,
  onOpenFeedback,
  onLogout,
  onShareApp,
  onOpenDonate,
  isGuestMode,
  onCancelAccount,
  notificationsEnabled: _notificationsEnabled,
  medicationRemindersEnabled: _medicationRemindersEnabled,
  snoozeMinutes,
  onNotificationsToggle: _onNotificationsToggle,
  onMedicationRemindersToggle: _onMedicationRemindersToggle,
  onEnableNotifications: _onEnableNotifications,
}: SettingsScreenProps) {
  const t = getTranslations(locale);
  const localeOptions = getLocaleOptions(locale);
  const {
    languagePickerOpen,
    setLanguagePickerOpen,
    logoutConfirmVisible,
    setLogoutConfirmVisible,
    cancelAccountVisible,
    setCancelAccountVisible,
    cancelPassword,
    setCancelPassword,
    cancelErrorText,
    setCancelErrorText,
    isCancelLoading,
    setIsCancelLoading,
    draftLocale,
    setDraftLocale,
    draftFontScale,
    setDraftFontScale,
    draftWeekStartsOn,
    setDraftWeekStartsOn,
    shortDisplayName,
    profileAvatarEmoji,
    isAppearanceDirty,
    version,
  } = useSettingsScreenState({ locale, fontScale, weekStartsOn });
  const [offers, setOffers] = useState<SubscriptionOffer[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [adFree, setAdFree] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const definitions = await loadAppDefinitions();
        setOffers(definitions.subscriptionOffers ?? []);
      } catch {
        setOffers([]);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAdFreeStatus((status) => setAdFree(status.isAdFree));
    void (async () => {
      const status = await getAdFreeStatus();
      setAdFree(status.isAdFree);
    })();
    return unsubscribe;
  }, []);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.settings} />

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>{profileAvatarEmoji}</Text></View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{`${t.hello}, ${shortDisplayName}`}</Text>
            {isGuestMode ? <Text style={styles.guestInfoText}>{t.guestProfileWarning}</Text> : null}
            {!isGuestMode ? (
              <Pressable onPress={onOpenProfile}>
                <Text style={styles.editLink}>{t.editProfile}</Text>
              </Pressable>
            ) : null}
          </View>
          {isGuestMode ? (
            <Pressable style={styles.completeProfileCta} onPress={onOpenSignUp}>
              <Text style={styles.completeProfileCtaText}>{t.signUpNow}</Text>
            </Pressable>
          ) : null}
        </View>

        <Section title={t.reminderAlarm}>
          <MenuRow testID="settings-notification-settings-row" label={t.notificationSettings} value={t.defaultAppSound} onPress={onOpenNotificationSettings} />
          <View style={styles.versionRow}>
            <Text style={styles.rowTitle}>{t.snoozeDuration}</Text>
            <Text style={styles.rowSubtitle}>{`${snoozeMinutes} min`}</Text>
          </View>
        </Section>

        {!isGuestMode ? (
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
            </View>

            <View style={styles.weekStartBlock}>
              <Text style={styles.rowTitle}>{t.weekStartsOn}</Text>
              <View style={styles.weekStartRow}>
                <Pressable
                  style={[styles.weekStartChip, draftWeekStartsOn === 'monday' && styles.weekStartChipActive]}
                  onPress={() => setDraftWeekStartsOn('monday')}
                >
                  <Text style={[styles.weekStartChipText, draftWeekStartsOn === 'monday' && styles.weekStartChipTextActive]}>
                    {t.weekStartsOnMonday}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.weekStartChip, draftWeekStartsOn === 'sunday' && styles.weekStartChipActive]}
                  onPress={() => setDraftWeekStartsOn('sunday')}
                >
                  <Text style={[styles.weekStartChipText, draftWeekStartsOn === 'sunday' && styles.weekStartChipTextActive]}>
                    {t.weekStartsOnSunday}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Button
              label={t.save}
              onPress={() => onSaveAppearance(draftLocale, draftFontScale, draftWeekStartsOn)}
              disabled={!isAppearanceDirty}
              size="s"
            />
          </Section>
        ) : null}

        <Section title={t.supportAndSecurity}>
          {!isGuestMode ? <MenuRow testID="settings-change-password-row" label={t.changePassword} onPress={onOpenChangePassword} /> : null}
          <MenuRow testID="settings-contact-us-row" label={t.contactUs} onPress={onOpenFeedback} />
          <MenuRow
            testID="settings-remove-ads-row"
            label={t.removeAds}
            value={adFree ? t.adFreeActive : undefined}
            onPress={() => setPaywallOpen(true)}
          />
          {!isGuestMode ? (
            <Pressable style={styles.logoutRow} onPress={() => setLogoutConfirmVisible(true)}>
              <Text style={styles.logoutText}>{t.logOut}</Text>
            </Pressable>
          ) : null}
          {!isGuestMode ? (
            <Pressable testID="settings-delete-account-row" style={styles.dangerRow} onPress={() => setCancelAccountVisible(true)}>
              <Text style={styles.dangerText}>{t.deleteAccount}</Text>
            </Pressable>
          ) : null}
        </Section>

        <Section title={t.aboutUs}>
          <MenuRow testID="settings-donate-row" label={t.donate} onPress={onOpenDonate} />
          <MenuRow testID="settings-share-app-row" label={t.shareApp} onPress={onShareApp} />
          <View style={styles.versionRow}>
            <Text style={styles.rowTitle}>{t.version}</Text>
            <Text style={styles.rowSubtitle}>{version}</Text>
          </View>
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
            <Text style={styles.confirmTitle}>{t.confirmLogout}</Text>
            <View style={styles.confirmActions}>
              <Button label={t.cancel} variant="outlined" onPress={() => setLogoutConfirmVisible(false)} />
              <Button
                label={t.logOut}
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

      <Modal transparent visible={cancelAccountVisible} animationType="fade" onRequestClose={() => setCancelAccountVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {t.confirmDeleteIrreversible}
            </Text>
            <TextField
              label={t.password}
              value={cancelPassword}
              secureTextEntry
              onChangeText={(value) => {
                setCancelPassword(value);
                setCancelErrorText('');
              }}
            />
            {cancelErrorText ? <Text style={styles.cancelErrorText}>{cancelErrorText}</Text> : null}
            <View style={styles.confirmActions}>
              <Button
                testID="cancel-account-dismiss-button"
                label={t.cancel}
                variant="outlined"
                onPress={() => {
                  setCancelAccountVisible(false);
                  setCancelPassword('');
                  setCancelErrorText('');
                }}
              />
              <Button
                testID="cancel-account-confirm-button"
                label={t.confirm}
                variant="danger"
                disabled={isCancelLoading}
                onPress={() => {
                  void (async () => {
                    if (cancelPassword.trim().length < 6) {
                      setCancelErrorText(t.passwordRequired);
                      return;
                    }

                    setIsCancelLoading(true);
                    const result = await onCancelAccount(cancelPassword);
                    setIsCancelLoading(false);
                    if (!result.ok) {
                      setCancelErrorText(result.message);
                      return;
                    }

                    setCancelAccountVisible(false);
                    setCancelPassword('');
                    setCancelErrorText('');
                  })();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={paywallOpen} animationType="slide" onRequestClose={() => setPaywallOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPaywallOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{t.removeAds}</Text>
            <Text style={styles.rowSubtitle}>{t.removeAdsDescription}</Text>
            {offers.map((offer) => (
              <Pressable
                key={offer.id}
                style={styles.subscriptionCard}
                onPress={() => {
                  void (async () => {
                    await activateAdFreeMode(offer.id);
                    setPaywallOpen(false);
                  })();
                }}
              >
                <Text style={styles.subscriptionTitle}>{offer.localized[locale]?.title ?? offer.localized.en?.title ?? offer.id}</Text>
                <Text style={styles.rowSubtitle}>
                  {offer.localized[locale]?.priceLabel ?? offer.localized.en?.priceLabel ?? ''}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
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
  testID?: string;
  label: string;
  value?: string;
  onPress?: () => void;
};

function MenuRow({ testID, label, value, onPress }: MenuRowProps) {
  return (
    <Pressable testID={testID} style={styles.menuRow} onPress={onPress} disabled={!onPress}>
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
    flex: 1,
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
  guestInfoText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    maxWidth: 220,
  },
  completeProfileCta: {
    minHeight: 34,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
    paddingHorizontal: theme.spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeProfileCtaText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
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
  versionRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  dangerRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  dangerText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.error[500],
    fontWeight: '700',
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
  cancelErrorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
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
  weekStartBlock: {
    gap: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[16],
  },
  weekStartRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  weekStartChip: {
    minHeight: 32,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStartChipActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  weekStartChipText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  weekStartChipTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
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
  subscriptionCard: {
    minHeight: 58,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
    justifyContent: 'center',
    gap: 2,
  },
  subscriptionTitle: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
