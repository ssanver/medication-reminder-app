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
import { MyMedsScreen } from '../screens/my-meds-screen';
import { ProfileScreen } from '../screens/profile-screen';
import { ReportsScreen } from '../screens/reports-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { TodayScreen } from '../screens/today-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';
type OverlayScreen = 'none' | 'reports' | 'profile';
type AppPhase = 'splash' | 'onboarding' | 'signup' | 'signin' | 'app';

const tabGlyph: Record<TabKey, AppIconName> = {
  today: 'home',
  'my-meds': 'pill',
  'add-meds': 'add',
  settings: 'settings',
};

export function AppNavigator() {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [locale, setLocale] = useState<Locale>('en');
  const [fontScale, setFontScale] = useState<number>(fontScaleLevels[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>('none');

  const t = getTranslations(locale);
  const steps = useMemo(() => getOnboardingSteps(locale), [locale]);

  useEffect(() => {
    if (phase !== 'splash') {
      return;
    }

    const timer = setTimeout(() => setPhase('onboarding'), 1200);

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
          <SignUpScreen locale={locale} onSuccess={() => setPhase('app')} onOpenSignIn={() => setPhase('signin')} />
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
          <ReportsScreen onBack={() => setOverlayScreen('none')} />
        </View>
      </View>
    );
  }

  if (overlayScreen === 'profile') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ProfileScreen onBack={() => setOverlayScreen('none')} />
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
          () => setOverlayScreen('reports'),
          () => setOverlayScreen('profile'),
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
  onOpenReports: () => void,
  onOpenProfile: () => void,
) {
  switch (tab) {
    case 'today':
      return <TodayScreen locale={locale} fontScale={fontScale} />;
    case 'my-meds':
      return <MyMedsScreen locale={locale} fontScale={fontScale} />;
    case 'add-meds':
      return <AddMedsScreen locale={locale} fontScale={fontScale} />;
    case 'settings':
      return (
        <SettingsScreen
          locale={locale}
          onLocaleChange={onLocaleChange}
          fontScale={fontScale}
          onOpenReports={onOpenReports}
          onOpenProfile={onOpenProfile}
          onFontScaleChange={(value) => {
            if (isFontScaleLevelValid(value)) {
              onFontScaleChange(value);
            }
          }}
        />
      );
    default:
      return <TodayScreen locale={locale} fontScale={fontScale} />;
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
