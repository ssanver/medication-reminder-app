import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getOnboardingSteps, isOnboardingStepCountValid } from '../features/onboarding/onboarding-steps';
import { OnboardingScreen } from '../screens/auth/onboarding-screen';
import { TodayScreen } from '../screens/today-screen';
import { MyMedsScreen } from '../screens/my-meds-screen';
import { AddMedsScreen } from '../screens/add-meds-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';

export function AppNavigator() {
  const [locale, setLocale] = useState<Locale>('tr');
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
      <View style={styles.content}>{renderTab(activeTab, locale, setLocale)}</View>
      <View style={styles.tabBar}>
        {renderTabButton('today', t.today, activeTab, setActiveTab)}
        {renderTabButton('my-meds', t.myMeds, activeTab, setActiveTab)}
        {renderTabButton('add-meds', t.addMeds, activeTab, setActiveTab)}
        {renderTabButton('settings', t.settings, activeTab, setActiveTab)}
      </View>
    </View>
  );
}

function renderTab(tab: TabKey, locale: Locale, onLocaleChange: (locale: Locale) => void) {
  switch (tab) {
    case 'today':
      return <TodayScreen locale={locale} />;
    case 'my-meds':
      return <MyMedsScreen locale={locale} />;
    case 'add-meds':
      return <AddMedsScreen locale={locale} />;
    case 'settings':
      return <SettingsScreen locale={locale} onLocaleChange={onLocaleChange} />;
    default:
      return <TodayScreen locale={locale} />;
  }
}

function renderTabButton(
  tab: TabKey,
  label: string,
  activeTab: TabKey,
  setActiveTab: (nextTab: TabKey) => void,
) {
  const isActive = tab === activeTab;

  return (
    <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.backgroundDefault,
  },
  content: {
    flex: 1,
    padding: theme.spacing[16],
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.semantic.backgroundDefault,
  },
  tabButton: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...theme.typography.caption,
    color: theme.colors.semantic.textSecondary,
  },
  activeTabLabel: {
    color: theme.colors.semantic.brandPrimary,
    fontWeight: '600',
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.semantic.stateError,
    padding: theme.spacing[16],
  },
});
