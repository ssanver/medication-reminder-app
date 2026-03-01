import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/ui/bottom-nav';
import type { AppIconName } from '../components/ui/app-icon';
import { ReminderPromptModal } from '../components/ui/reminder-prompt-modal';
import { fontScaleLevels, isFontScaleLevelValid } from '../features/accessibility/accessibility-settings';
import { resolveInitialPhase } from '../features/auth/auth-flow';
import {
  clearSessionForLogout,
  loadOrCreateDeviceId,
  subscribeAuthSession,
  loadAuthSession,
  loadAccessToken,
  markGuestMode,
  markAuthenticated,
  setEmailVerified,
  setOnboardingCompleted,
  setSplashSeen,
} from '../features/auth/auth-session-store';
import { cancelAccount } from '../features/auth/email-auth-service';
import { createGuestSession } from '../features/auth/email-auth-service';
import {
  getEmailVerificationStatus,
  requestEmailVerification,
  resendEmailVerification,
  verifyEmailCode,
} from '../features/auth/email-verification-service';
import { setAppFontScale } from '../features/accessibility/app-font-scale';
import { getTranslations, type Locale } from '../features/localization/localization';
import { openDonationPage } from '../features/monetization/monetization-service';
import { clearMedicationStore, hydrateMedicationStore } from '../features/medications/medication-store';
import { useMedicationStore } from '../features/medications/use-medication-store';
import { handleReminderSkip, handleReminderSnooze, handleReminderTakeNow } from '../features/notifications/notification-center-service';
import { getOnboardingSteps, isOnboardingStepCountValid } from '../features/onboarding/onboarding-steps';
import {
  emitDueReminderPrompt,
  ensureNotificationPermissions,
  getReminderPromptSnapshot,
  subscribeReminderPrompt,
  syncMedicationReminderNotifications,
} from '../features/notifications/local-notifications';
import { loadAppPreferences, saveAppPreferences, updateLocalePreference } from '../features/settings/app-preferences';
import { loadWeekStartPreference, saveWeekStartPreference } from '../features/settings/week-start-preference-service';
import { clearProfile } from '../features/profile/profile-store';
import { shareApplication } from '../features/share/app-share';
import { AddMedsScreen } from '../screens/add-meds-screen';
import { OnboardingScreen } from '../screens/auth/onboarding-screen';
import { SignInScreen } from '../screens/auth/sign-in-screen';
import { SignUpScreen } from '../screens/auth/sign-up-screen';
import { ChangePasswordScreen } from '../screens/change-password-screen';
import { FeedbackScreen } from '../screens/feedback-screen';
import { EmailVerificationScreen } from '../screens/email-verification-screen';
import { SplashScreen } from '../screens/auth/splash-screen';
import { MyMedsScreen } from '../screens/my-meds-screen';
import { NotificationHistoryScreen } from '../screens/notification-history-screen';
import { NotificationSettingsScreen } from '../screens/notification-settings-screen';
import { PlaceholderDetailScreen } from '../screens/placeholder-detail-screen';
import { ProfileScreen } from '../screens/profile-screen';
import { ReminderPreferencesScreen } from '../screens/reminder-preferences-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { TodayScreen } from '../screens/today-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';
type OverlayScreen =
  | 'none'
  | 'profile'
  | 'medication-details'
  | 'notification-history'
  | 'notification-settings'
  | 'reminder-preferences'
  | 'change-password'
  | 'feedback'
  | 'email-verification'
  | 'about-us';
type AppPhase = 'splash' | 'onboarding' | 'signup' | 'signin' | 'app';

const tabGlyph: Record<TabKey, AppIconName> = {
  today: 'home',
  'my-meds': 'pill',
  'add-meds': 'add',
  settings: 'settings',
};

export function AppNavigator() {
  const medicationStore = useMedicationStore();
  const reminderPrompt = useSyncExternalStore(subscribeReminderPrompt, getReminderPromptSnapshot, getReminderPromptSnapshot);
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [locale, setLocale] = useState<Locale>('tr');
  const [fontScale, setFontScale] = useState<number>(fontScaleLevels[0]);
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [medicationRemindersEnabled, setMedicationRemindersEnabled] = useState(true);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>('none');
  const [selectedMedicationId, setSelectedMedicationId] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [emailVerified, setEmailVerifiedState] = useState(true);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const t = getTranslations(locale);
  const steps = useMemo(() => getOnboardingSteps(locale), [locale]);

  async function requestGuestSession() {
    const deviceId = await loadOrCreateDeviceId();
    return createGuestSession({ deviceId });
  }

  useEffect(() => {
    if (phase !== 'splash') {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      let session = await loadAuthSession();
      if (!session.isLoggedIn && !session.isGuestMode) {
        try {
          const guestSession = await requestGuestSession();
          await markGuestMode({
            accessToken: guestSession.accessToken,
            refreshToken: guestSession.refreshToken,
            email: guestSession.email,
          });
        } catch {
          await markGuestMode();
        }
        session = await loadAuthSession();
      }
      if (!session.isLoggedIn && session.isGuestMode) {
        const token = await loadAccessToken();
        if (!token) {
          try {
            const guestSession = await requestGuestSession();
            await markGuestMode({
              accessToken: guestSession.accessToken,
              refreshToken: guestSession.refreshToken,
              email: guestSession.email,
            });
            session = await loadAuthSession();
          } catch {
            // Keep guest mode active; network-dependent sync will retry later.
          }
        }
      }
      timer = setTimeout(() => {
        void (async () => {
        setAccountEmail(session.email);
        setIsGuestMode(session.isGuestMode);
        setEmailVerifiedState(session.emailVerified || session.email.length === 0);
        if (session.email) {
          try {
            const status = await getEmailVerificationStatus(session.email);
            setEmailVerifiedState(status.isVerified);
            setEmailResendCooldown(status.resendAvailableInSeconds ?? 0);
            if (status.isVerified) {
              await setEmailVerified(true);
            }
          } catch {
            // Keep local session fallback when API is not reachable.
          }
        }
        await setSplashSeen(true);
        setPhase(resolveInitialPhase(session));
        })();
      }, session.hasSeenSplashOnce ? 500 : 1600);
    })();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [phase]);

  useEffect(() => {
    void (async () => {
      const preferences = await loadAppPreferences();
      setLocale(preferences.locale);
      setFontScale(preferences.fontScale);
      setNotificationsEnabled(preferences.notificationsEnabled);
      setMedicationRemindersEnabled(preferences.medicationRemindersEnabled);
      setSnoozeMinutes(preferences.snoozeMinutes);

      try {
        const weekStart = await loadWeekStartPreference();
        setWeekStartsOn(weekStart);
      } catch {
        setWeekStartsOn('monday');
      }
    })();
  }, []);

  useEffect(() => {
    if (phase !== 'app') {
      return;
    }

    void (async () => {
      try {
        const weekStart = await loadWeekStartPreference();
        setWeekStartsOn(weekStart);
      } catch {
        // Keep the current in-memory preference when API is unreachable.
      }
    })();
  }, [accountEmail, phase]);

  useEffect(() => {
    void saveAppPreferences({
      locale,
      fontScale,
      notificationsEnabled,
      medicationRemindersEnabled,
      snoozeMinutes,
    });
  }, [locale, fontScale, notificationsEnabled, medicationRemindersEnabled, snoozeMinutes]);

  useEffect(() => {
    setAppFontScale(fontScale);
  }, [fontScale]);

  useEffect(() => {
    if (!medicationStore.isHydrated) {
      return;
    }

    void syncMedicationReminderNotifications(locale, notificationsEnabled && medicationRemindersEnabled);
  }, [locale, notificationsEnabled, medicationRemindersEnabled, medicationStore.isHydrated, medicationStore.medications, medicationStore.events]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && medicationStore.isHydrated) {
        void syncMedicationReminderNotifications(locale, notificationsEnabled && medicationRemindersEnabled);
        if (notificationsEnabled && medicationRemindersEnabled) {
          void emitDueReminderPrompt(locale);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [locale, notificationsEnabled, medicationRemindersEnabled, medicationStore.isHydrated]);

  useEffect(() => {
    if (phase !== 'app' || !medicationStore.isHydrated || !notificationsEnabled || !medicationRemindersEnabled) {
      return;
    }

    void emitDueReminderPrompt(locale);
    const timer = setInterval(() => {
      void emitDueReminderPrompt(locale);
    }, 15000);

    return () => clearInterval(timer);
  }, [phase, locale, notificationsEnabled, medicationRemindersEnabled, medicationStore.isHydrated, medicationStore.medications, medicationStore.events]);

  useEffect(() => {
    const unsubscribe = subscribeAuthSession(() => {
      void (async () => {
        const session = await loadAuthSession();
        if (!session.isLoggedIn && phase === 'app') {
          if (session.isGuestMode) {
            return;
          }
          await clearMedicationStore();
          setAccountEmail('');
          setIsGuestMode(false);
          setEmailVerifiedState(true);
          setOverlayScreen('none');
          setActiveTab('today');
          setPhase('signin');
        }
      })();
    });

    return unsubscribe;
  }, [phase]);

  if (!isOnboardingStepCountValid(steps)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Onboarding step count must be between 1 and 5.</Text>
      </View>
    );
  }

  if (phase === 'splash') {
    return <SplashScreen />;
  }

  if (phase === 'onboarding') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <OnboardingScreen
            locale={locale}
            stepIndex={onboardingStep}
            onSkip={() => {
              void (async () => {
                await setOnboardingCompleted(true);
                setPhase('signup');
              })();
            }}
            onOpenSignIn={() => {
              void (async () => {
                await setOnboardingCompleted(true);
                setPhase('signin');
              })();
            }}
            onNextStep={() => {
              const lastStepIndex = steps.length - 1;

              if (onboardingStep < lastStepIndex) {
                setOnboardingStep((prev) => prev + 1);
              } else {
                void (async () => {
                  await setOnboardingCompleted(true);
                  setPhase('signup');
                })();
              }
            }}
          />
        </View>
      </View>
    );
  }

  if (phase === 'signup') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <SignUpScreen
            locale={locale}
            onSuccess={(payload) => {
              void (async () => {
                await markAuthenticated({
                  accessToken: payload.session?.accessToken,
                  refreshToken: payload.session?.refreshToken,
                  email: payload.email,
                  emailVerified: payload.emailVerified,
                });
                await clearMedicationStore();
                try {
                  await hydrateMedicationStore();
                  const latestPreferences = await loadAppPreferences();
                  await syncMedicationReminderNotifications(
                    latestPreferences.locale,
                    latestPreferences.notificationsEnabled && latestPreferences.medicationRemindersEnabled,
                  );
                } catch {
                  // Keep login flow resilient; periodic sync effects retry in app phase.
                }
                setAccountEmail(payload.email);
                setIsGuestMode(false);
                setEmailVerifiedState(payload.emailVerified);
                if (!payload.emailVerified) {
                  try {
                    const response = await requestEmailVerification(payload.email);
                    setEmailResendCooldown(response.resendAvailableInSeconds ?? 60);
                  } catch {
                    setEmailResendCooldown(60);
                  }
                } else {
                  setEmailResendCooldown(0);
                }
                setPhase('app');
              })();
            }}
            onOpenSignIn={() => setPhase('signin')}
            onBack={() => {
              setOnboardingStep(Math.max(steps.length - 1, 0));
              setPhase('onboarding');
            }}
            onContinueAsGuest={() => {
              void (async () => {
                try {
                  const guestSession = await requestGuestSession();
                  await markGuestMode({
                    accessToken: guestSession.accessToken,
                    refreshToken: guestSession.refreshToken,
                    email: guestSession.email,
                  });
                } catch {
                  await markGuestMode();
                }
                await clearMedicationStore();
                await hydrateMedicationStore();
                const updatedSession = await loadAuthSession();
                setAccountEmail(updatedSession.email);
                setIsGuestMode(true);
                setEmailVerifiedState(true);
                setPhase('app');
              })();
            }}
          />
        </View>
      </View>
    );
  }

  if (phase === 'signin') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <SignInScreen
            locale={locale}
            onSuccess={(payload) => {
              void (async () => {
                let isEmailVerified = payload.emailVerified;
                if (!payload.session && payload.email) {
                  try {
                    const status = await getEmailVerificationStatus(payload.email);
                    isEmailVerified = status.isVerified;
                  } catch {
                    // Fallback to the incoming payload value when status is unavailable.
                  }
                }

                await markAuthenticated({
                  accessToken: payload.session?.accessToken,
                  refreshToken: payload.session?.refreshToken,
                  email: payload.email,
                  emailVerified: isEmailVerified,
                });
                await clearMedicationStore();
                try {
                  await hydrateMedicationStore();
                  const latestPreferences = await loadAppPreferences();
                  await syncMedicationReminderNotifications(
                    latestPreferences.locale,
                    latestPreferences.notificationsEnabled && latestPreferences.medicationRemindersEnabled,
                  );
                } catch {
                  // Keep login flow resilient; periodic sync effects retry in app phase.
                }
                setAccountEmail(payload.email);
                setIsGuestMode(false);
                setEmailVerifiedState(isEmailVerified);
                setPhase('app');
              })();
            }}
            onOpenSignUp={() => setPhase('signup')}
            onContinueAsGuest={() => {
              void (async () => {
                try {
                  const guestSession = await requestGuestSession();
                  await markGuestMode({
                    accessToken: guestSession.accessToken,
                    refreshToken: guestSession.refreshToken,
                    email: guestSession.email,
                  });
                } catch {
                  await markGuestMode();
                }
                await clearMedicationStore();
                await hydrateMedicationStore();
                const updatedSession = await loadAuthSession();
                setAccountEmail(updatedSession.email);
                setIsGuestMode(true);
                setEmailVerifiedState(true);
                setPhase('app');
              })();
            }}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'profile') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ProfileScreen
            locale={locale}
            isGuestMode={isGuestMode}
            onOpenSignUp={() => {
              setOverlayScreen('none');
              setPhase('signup');
            }}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'medication-details') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <AddMedsScreen
            locale={locale}
            fontScale={fontScale}
            weekStartsOn={weekStartsOn}
            mode="edit"
            medicationId={selectedMedicationId}
            onBack={() => setOverlayScreen('none')}
            onMedicationSaved={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'notification-history') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <NotificationHistoryScreen locale={locale} onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'notification-settings') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <NotificationSettingsScreen
            locale={locale}
            notificationsEnabled={notificationsEnabled}
            remindersEnabled={medicationRemindersEnabled}
            onNotificationsChange={async (value) => {
              if (!value) {
                setNotificationsEnabled(false);
                setMedicationRemindersEnabled(false);
                return;
              }

              const granted = await ensureNotificationPermissions();
              setNotificationsEnabled(granted);
              if (granted) {
                setMedicationRemindersEnabled(true);
              }
            }}
            onRemindersChange={async (value) => {
              if (!value) {
                setMedicationRemindersEnabled(false);
                return;
              }

              if (!notificationsEnabled) {
                const granted = await ensureNotificationPermissions();
                setNotificationsEnabled(granted);
                if (!granted) {
                  return;
                }
              }

              setMedicationRemindersEnabled(true);
            }}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'reminder-preferences') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ReminderPreferencesScreen
            locale={locale}
            snoozeMinutes={snoozeMinutes}
            onSnoozeMinutesChange={setSnoozeMinutes}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'change-password') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ChangePasswordScreen locale={locale} onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'feedback') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <FeedbackScreen locale={locale} onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'email-verification') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <EmailVerificationScreen
            locale={locale}
            email={accountEmail}
            initialCooldownSeconds={emailResendCooldown}
            onBack={() => setOverlayScreen('none')}
            onVerify={async (code) => {
              try {
                const response = await verifyEmailCode(accountEmail, code);
                if (response.isVerified) {
                  await setEmailVerified(true);
                  setEmailVerifiedState(true);
                  return { ok: true, message: t.emailVerified };
                }

                return { ok: false, message: t.emailVerificationCodeInvalid };
              } catch (error) {
                const message = error instanceof Error ? error.message : t.emailVerificationFailed;
                return { ok: false, message };
              }
            }}
            onResend={async () => {
              try {
                const response = await resendEmailVerification(accountEmail);
                const nextCooldown = response.resendAvailableInSeconds ?? 60;
                return {
                  ok: true,
                  message: t.emailVerificationResent,
                  cooldownSeconds: nextCooldown,
                };
              } catch (error) {
                const message = error instanceof Error ? error.message : t.emailVerificationResendFailed;
                return {
                  ok: false,
                  message,
                  cooldownSeconds: 60,
                };
              }
            }}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'about-us') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <PlaceholderDetailScreen
            locale={locale}
            title={t.aboutUs}
            description={t.aboutUsDescription}
            items={['Pill Mind', t.versionInformation]}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderTab(
          activeTab,
          locale,
          async (nextLocale) => {
            setLocale(nextLocale);
            await updateLocalePreference(nextLocale);
          },
          fontScale,
          setFontScale,
          weekStartsOn,
          setWeekStartsOn,
          notificationsEnabled,
          medicationRemindersEnabled,
          snoozeMinutes,
          setNotificationsEnabled,
          setMedicationRemindersEnabled,
          async () => {
            const granted = await ensureNotificationPermissions();
            setNotificationsEnabled(granted);
            setMedicationRemindersEnabled(granted);
          },
          () => setActiveTab('add-meds'),
          () => setActiveTab('my-meds'),
          (medicationId) => {
            setSelectedMedicationId(medicationId);
            setOverlayScreen('medication-details');
          },
          () => setOverlayScreen('profile'),
          () => setPhase('signup'),
          () => setOverlayScreen('notification-settings'),
          () => setOverlayScreen('notification-history'),
          () => setOverlayScreen('reminder-preferences'),
          () => setOverlayScreen('change-password'),
          () => setOverlayScreen('feedback'),
          () => {
            void (async () => {
              await clearMedicationStore();
              await clearSessionForLogout();
              setAccountEmail('');
              setIsGuestMode(false);
              setEmailVerifiedState(true);
              setOverlayScreen('none');
              setActiveTab('today');
              setPhase('signin');
            })();
          },
          () => {
            void shareApplication();
          },
          () => {
            void openDonationPage();
          },
          async (password) => {
            try {
              await cancelAccount({
                email: accountEmail,
                password,
              });
              await clearMedicationStore();
              await clearProfile();
              await clearSessionForLogout();
              setAccountEmail('');
              setIsGuestMode(false);
              setEmailVerifiedState(true);
              setOverlayScreen('none');
              setActiveTab('today');
              setPhase('signin');
              return {
                ok: true,
                message: t.accountDeleted,
              };
            } catch (error) {
              return {
                ok: false,
                message: error instanceof Error ? error.message : t.accountDeleteFailed,
              };
            }
          },
          () => setOverlayScreen('email-verification'),
          !isGuestMode && Boolean(accountEmail) && !emailVerified,
          isGuestMode,
        )}
      </View>
      <BottomNav
        items={[
          { key: 'today', label: t.today, icon: tabGlyph.today },
          { key: 'my-meds', label: t.myMeds, icon: tabGlyph['my-meds'] },
          { key: 'add-meds', label: t.addMeds, icon: tabGlyph['add-meds'] },
          { key: 'settings', label: t.settings, icon: tabGlyph.settings },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      />
      <ReminderPromptModal
        visible={Boolean(reminderPrompt)}
        locale={locale}
        snoozeMinutes={snoozeMinutes}
        reminder={reminderPrompt}
        onTakeNow={() => {
          if (!reminderPrompt) {
            return;
          }
          void handleReminderTakeNow(reminderPrompt);
        }}
        onSnooze={() => {
          if (!reminderPrompt) {
            return;
          }
          void handleReminderSnooze(reminderPrompt, snoozeMinutes, locale);
        }}
        onSkip={() => {
          if (!reminderPrompt) {
            return;
          }
          void handleReminderSkip(reminderPrompt);
        }}
      />
    </View>
  );
}

function renderTab(
  tab: TabKey,
  locale: Locale,
  onLocaleChange: (locale: Locale) => void,
  fontScale: number,
  onFontScaleChange: (value: number) => void,
  weekStartsOn: 'monday' | 'sunday',
  onWeekStartsOnChange: (value: 'monday' | 'sunday') => void,
  notificationsEnabled: boolean,
  medicationRemindersEnabled: boolean,
  snoozeMinutes: number,
  onNotificationsToggle: (value: boolean) => void,
  onMedicationRemindersToggle: (value: boolean) => void,
  onEnableNotifications: () => void,
  onOpenAddMeds: () => void,
  onMedicationSaved: () => void,
  onOpenMedicationDetails: (medicationId: string) => void,
  onOpenProfile: () => void,
  onOpenSignUp: () => void,
  onOpenNotificationSettings: () => void,
  onOpenNotificationHistory: () => void,
  onOpenReminderPreferences: () => void,
  onOpenChangePassword: () => void,
  onOpenFeedback: () => void,
  onLogout: () => void,
  onShareApp: () => void,
  onOpenDonate: () => void,
  onCancelAccount: (password: string) => Promise<{ ok: boolean; message: string }>,
  onOpenEmailVerification: () => void,
  showEmailVerificationAlert: boolean,
  isGuestMode: boolean,
) {
  switch (tab) {
    case 'today':
      return (
        <TodayScreen
          locale={locale}
          fontScale={fontScale}
          weekStartsOn={weekStartsOn}
          onOpenAddMedication={onOpenAddMeds}
          onOpenSignUp={onOpenSignUp}
          remindersEnabled={medicationRemindersEnabled && notificationsEnabled}
          snoozeMinutes={snoozeMinutes}
          isGuestMode={isGuestMode}
          onOpenNotificationHistory={onOpenNotificationHistory}
          onOpenEmailVerification={onOpenEmailVerification}
          showEmailVerificationAlert={showEmailVerificationAlert}
        />
      );
    case 'my-meds':
      return (
        <MyMedsScreen
          locale={locale}
          fontScale={fontScale}
          onOpenMedicationDetails={onOpenMedicationDetails}
          onOpenAddMedication={onOpenAddMeds}
        />
      );
    case 'add-meds':
      return <AddMedsScreen locale={locale} fontScale={fontScale} weekStartsOn={weekStartsOn} onMedicationSaved={onMedicationSaved} />;
    case 'settings':
      return (
        <SettingsScreen
          locale={locale}
          fontScale={fontScale}
          weekStartsOn={weekStartsOn}
          onSaveAppearance={(nextLocale, nextFontScale, nextWeekStartsOn) => {
            onLocaleChange(nextLocale);
            if (isFontScaleLevelValid(nextFontScale)) {
              onFontScaleChange(nextFontScale);
            }
            onWeekStartsOnChange(nextWeekStartsOn);
            void saveWeekStartPreference(nextWeekStartsOn);
          }}
          onOpenProfile={onOpenProfile}
          onOpenSignUp={onOpenSignUp}
          onOpenNotificationSettings={onOpenNotificationSettings}
          onOpenReminderPreferences={onOpenReminderPreferences}
          onOpenChangePassword={onOpenChangePassword}
          onOpenFeedback={onOpenFeedback}
          onLogout={onLogout}
          onShareApp={onShareApp}
          onOpenDonate={onOpenDonate}
          onCancelAccount={onCancelAccount}
          isGuestMode={isGuestMode}
          notificationsEnabled={notificationsEnabled}
          medicationRemindersEnabled={medicationRemindersEnabled}
          snoozeMinutes={snoozeMinutes}
          onNotificationsToggle={onNotificationsToggle}
          onMedicationRemindersToggle={onMedicationRemindersToggle}
          onEnableNotifications={onEnableNotifications}
        />
      );
    default:
      return (
        <TodayScreen
          locale={locale}
          fontScale={fontScale}
          weekStartsOn={weekStartsOn}
          onOpenAddMedication={onOpenAddMeds}
          onOpenSignUp={onOpenSignUp}
          remindersEnabled={medicationRemindersEnabled && notificationsEnabled}
          snoozeMinutes={snoozeMinutes}
          isGuestMode={isGuestMode}
          onOpenNotificationHistory={onOpenNotificationHistory}
          onOpenEmailVerification={onOpenEmailVerification}
          showEmailVerificationAlert={showEmailVerificationAlert}
        />
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.grid.marginWidth,
    paddingTop: theme.spacing[8],
  },
  errorText: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.stateError,
    padding: theme.spacing[16],
  },
});
