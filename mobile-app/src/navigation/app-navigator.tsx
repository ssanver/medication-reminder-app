import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontScaleLevels, isFontScaleLevelValid } from '../features/accessibility/accessibility-settings';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getOnboardingSteps, isOnboardingStepCountValid } from '../features/onboarding/onboarding-steps';
import { OnboardingScreen } from '../screens/auth/onboarding-screen';
import { AddMedsScreen } from '../screens/add-meds-screen';
import { MyMedsScreen } from '../screens/my-meds-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { TodayScreen } from '../screens/today-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';

const tabGlyph: Record<TabKey, string> = {
  today: 'T',
  'my-meds': 'M',
  'add-meds': '+',
  settings: 'S',
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
      <View style={styles.tabBar}>
        {renderTabButton('today', t.today, activeTab, setActiveTab)}
        {renderTabButton('my-meds', t.myMeds, activeTab, setActiveTab)}
        {renderTabButton('add-meds', t.addMeds, activeTab, setActiveTab)}
        {renderTabButton('settings', t.settings, activeTab, setActiveTab)}
      </View>
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

function renderTabButton(
  tab: TabKey,
  label: string,
  activeTab: TabKey,
  setActiveTab: (nextTab: TabKey) => void,
) {
  const isActive = tab === activeTab;

  return (
    <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, isActive && styles.activeTabButton]}>
      <Text style={[styles.glyph, isActive && styles.activeGlyph]}>{tabGlyph[tab]}</Text>
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primaryBlue[50],
  },
  content: {
    flex: 1,
    padding: theme.spacing[16],
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    gap: theme.spacing[8],
  },
  tabButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primaryBlue[50],
  },
  glyph: {
    ...theme.typography.caption,
    color: theme.colors.semantic.textSecondary,
    fontWeight: '700',
  },
  activeGlyph: {
    color: theme.colors.semantic.brandPrimary,
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
