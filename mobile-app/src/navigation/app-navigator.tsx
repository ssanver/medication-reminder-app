import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/ui/bottom-nav';
import type { AppIconName } from '../components/ui/app-icon';
import { fontScaleLevels, isFontScaleLevelValid } from '../features/accessibility/accessibility-settings';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getOnboardingSteps, isOnboardingStepCountValid } from '../features/onboarding/onboarding-steps';
import { AddMedsScreen } from '../screens/add-meds-screen';
import { OnboardingScreen } from '../screens/auth/onboarding-screen';
import { SignInScreen } from '../screens/auth/sign-in-screen';
import { SignUpScreen } from '../screens/auth/sign-up-screen';
import { SplashScreen } from '../screens/auth/splash-screen';
import { MedicationDetailsScreen } from '../screens/medication-details-screen';
import { MyMedsScreen } from '../screens/my-meds-screen';
import { PlaceholderDetailScreen } from '../screens/placeholder-detail-screen';
import { ProfileScreen } from '../screens/profile-screen';
import { ReportsScreen } from '../screens/reports-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { TodayScreen } from '../screens/today-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';
type OverlayScreen =
  | 'none'
  | 'reports'
  | 'profile'
  | 'medication-details'
  | 'notification-settings'
  | 'reminder-preferences'
  | 'appearance'
  | 'privacy-security'
  | 'change-password'
  | 'accounts-center'
  | 'about-us';
type AppPhase = 'splash' | 'onboarding' | 'signup' | 'signin' | 'app';

const tabGlyph: Record<TabKey, AppIconName> = {
  today: 'home',
  'my-meds': 'pill',
  'add-meds': 'add',
  settings: 'settings',
};

export function AppNavigator() {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [locale, setLocale] = useState<Locale>('tr');
  const [fontScale, setFontScale] = useState<number>(fontScaleLevels[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>('none');
  const [selectedMedicationId, setSelectedMedicationId] = useState('');

  const t = getTranslations(locale);
  const steps = useMemo(() => getOnboardingSteps(locale), [locale]);

  useEffect(() => {
    if (phase !== 'splash') {
      return;
    }

    const timer = setTimeout(() => setPhase('onboarding'), 1600);

    return () => clearTimeout(timer);
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
            onSkip={() => setPhase('signup')}
            onOpenSignIn={() => setPhase('signin')}
            onNextStep={() => {
              const lastStepIndex = steps.length - 1;

              if (onboardingStep < lastStepIndex) {
                setOnboardingStep((prev) => prev + 1);
              } else {
                setPhase('signup');
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
            onSuccess={() => setPhase('app')}
            onOpenSignIn={() => setPhase('signin')}
            onBack={() => {
              setOnboardingStep(Math.max(steps.length - 1, 0));
              setPhase('onboarding');
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
          <SignInScreen locale={locale} onSuccess={() => setPhase('app')} onOpenSignUp={() => setPhase('signup')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'reports') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ReportsScreen locale={locale} onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'profile') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ProfileScreen locale={locale} onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'medication-details') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <MedicationDetailsScreen locale={locale} medicationId={selectedMedicationId} onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'notification-settings') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <PlaceholderDetailScreen
            locale={locale}
            title={t.notificationSettings}
            description={t.notificationSettingsDescription}
            items={[t.defaultAppSound, t.appNotifications]}
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
          <PlaceholderDetailScreen
            locale={locale}
            title={t.reminderPreferences}
            description={t.reminderPreferencesDescription}
            items={[t.frequency, t.snoozeDuration]}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'appearance') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <PlaceholderDetailScreen
            locale={locale}
            title={t.appearance}
            description={t.appearanceDescription}
            items={[t.language, t.displayZoom]}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'privacy-security') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <PlaceholderDetailScreen
            locale={locale}
            title={t.privacySecurity}
            description={t.privacySecurityDescription}
            items={[t.changePassword]}
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
          <PlaceholderDetailScreen
            locale={locale}
            title={t.changePassword}
            description={t.changePasswordDescription}
            onBack={() => setOverlayScreen('none')}
          />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'accounts-center') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <PlaceholderDetailScreen
            locale={locale}
            title={t.accountsCenter}
            description={t.accountsCenterDescription}
            items={['Mom', t.addAnotherAccount]}
            onBack={() => setOverlayScreen('none')}
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
          setLocale,
          fontScale,
          setFontScale,
          () => setActiveTab('add-meds'),
          () => setActiveTab('my-meds'),
          (medicationId) => {
            setSelectedMedicationId(medicationId);
            setOverlayScreen('medication-details');
          },
          () => setOverlayScreen('reports'),
          () => setOverlayScreen('profile'),
          () => setOverlayScreen('notification-settings'),
          () => setOverlayScreen('reminder-preferences'),
          () => setOverlayScreen('appearance'),
          () => setOverlayScreen('privacy-security'),
          () => setOverlayScreen('change-password'),
          () => setOverlayScreen('accounts-center'),
          () => setOverlayScreen('about-us'),
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
    </View>
  );
}

function renderTab(
  tab: TabKey,
  locale: Locale,
  onLocaleChange: (locale: Locale) => void,
  fontScale: number,
  onFontScaleChange: (value: number) => void,
  onOpenAddMeds: () => void,
  onMedicationSaved: () => void,
  onOpenMedicationDetails: (medicationId: string) => void,
  onOpenReports: () => void,
  onOpenProfile: () => void,
  onOpenNotificationSettings: () => void,
  onOpenReminderPreferences: () => void,
  onOpenAppearance: () => void,
  onOpenPrivacySecurity: () => void,
  onOpenChangePassword: () => void,
  onOpenAccountsCenter: () => void,
  onOpenAboutUs: () => void,
) {
  switch (tab) {
    case 'today':
      return <TodayScreen locale={locale} fontScale={fontScale} onOpenAddMedication={onOpenAddMeds} />;
    case 'my-meds':
      return <MyMedsScreen locale={locale} fontScale={fontScale} onOpenMedicationDetails={onOpenMedicationDetails} />;
    case 'add-meds':
      return <AddMedsScreen locale={locale} fontScale={fontScale} onMedicationSaved={onMedicationSaved} />;
    case 'settings':
      return (
        <SettingsScreen
          locale={locale}
          onLocaleChange={onLocaleChange}
          fontScale={fontScale}
          onOpenReports={onOpenReports}
          onOpenProfile={onOpenProfile}
          onOpenNotificationSettings={onOpenNotificationSettings}
          onOpenReminderPreferences={onOpenReminderPreferences}
          onOpenAppearance={onOpenAppearance}
          onOpenPrivacySecurity={onOpenPrivacySecurity}
          onOpenChangePassword={onOpenChangePassword}
          onOpenAccountsCenter={onOpenAccountsCenter}
          onOpenAboutUs={onOpenAboutUs}
          onFontScaleChange={(value) => {
            if (isFontScaleLevelValid(value)) {
              onFontScaleChange(value);
            }
          }}
        />
      );
    default:
      return <TodayScreen locale={locale} fontScale={fontScale} onOpenAddMedication={onOpenAddMeds} />;
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
