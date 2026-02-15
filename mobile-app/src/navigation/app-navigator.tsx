import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontScaleLevels, isFontScaleLevelValid } from '../features/accessibility/accessibility-settings';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getOnboardingSteps, isOnboardingStepCountValid } from '../features/onboarding/onboarding-steps';
import { BottomNav } from '../components/ui/bottom-nav';
import { OnboardingScreen } from '../screens/auth/onboarding-screen';
import { AddMedsScreen } from '../screens/add-meds-screen';
import { MyMedsScreen } from '../screens/my-meds-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { TodayScreen } from '../screens/today-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';

const tabGlyph: Record<TabKey, string> = {
  today: '⌂',
  'my-meds': '💊',
  'add-meds': '⊕',
  settings: '⚙',
};

export function AppNavigator() {
  const [locale, setLocale] = useState<Locale>('tr');
  const [fontScale, setFontScale] = useState<number>(fontScaleLevels[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const t = getTranslations(locale);
  const steps = useMemo(() => getOnboardingSteps(locale), [locale]);

  if (!isOnboardingStepCountValid(steps)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Onboarding step count must be between 1 and 5.</Text>
      </View>
    );
  }

  if (!isOnboardingCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <OnboardingScreen
            locale={locale}
            stepIndex={onboardingStep}
            consentAccepted={consentAccepted}
            notificationGranted={notificationGranted}
            onToggleConsent={setConsentAccepted}
            onLocaleChange={setLocale}
            onNotificationDecision={setNotificationGranted}
            onNextStep={() => {
              const lastStepIndex = steps.length - 1;
              if (onboardingStep < lastStepIndex) {
                setOnboardingStep((previous) => previous + 1);
              } else {
                setIsOnboardingCompleted(true);
              }
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderTab(activeTab, locale, setLocale, fontScale, setFontScale)}</View>
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
    backgroundColor: theme.colors.primaryBlue[50],
  },
  content: {
    flex: 1,
    padding: theme.grid.marginWidth,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.semantic.stateError,
    padding: theme.spacing[16],
  },
});
