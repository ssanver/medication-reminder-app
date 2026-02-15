import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { getOnboardingSteps } from '../../features/onboarding/onboarding-steps';
import { type Locale, getTranslations } from '../../features/localization/localization';
import { theme } from '../../theme';

type OnboardingScreenProps = {
  locale: Locale;
  stepIndex: number;
  consentAccepted: boolean;
  notificationGranted: boolean;
  onNextStep: () => void;
  onToggleConsent: (value: boolean) => void;
  onNotificationDecision: (granted: boolean) => void;
  onLocaleChange: (locale: Locale) => void;
};

export function OnboardingScreen({
  locale,
  stepIndex,
  consentAccepted,
  notificationGranted,
  onNextStep,
  onToggleConsent,
  onNotificationDecision,
  onLocaleChange,
}: OnboardingScreenProps) {
  const t = getTranslations(locale);
  const steps = getOnboardingSteps(locale);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.languageRow}>
        <Text style={styles.secondaryText}>{t.languageTitle}</Text>
        <View style={styles.languageButtons}>
          <Pressable onPress={() => onLocaleChange('tr')} style={styles.chip}>
            <Text>TR</Text>
          </Pressable>
          <Pressable onPress={() => onLocaleChange('en')} style={styles.chip}>
            <Text>EN</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.secondaryText}>{step.description}</Text>

      {step.id === 'consent' ? (
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.secondaryText}>{t.consentLabel}</Text>
            <Switch value={consentAccepted} onValueChange={onToggleConsent} />
          </View>
          <View style={styles.switchRow}>
            <Pressable style={styles.secondaryButton} onPress={() => onNotificationDecision(true)}>
              <Text>{t.allowNotifications}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => onNotificationDecision(false)}>
              <Text>{t.denyNotifications}</Text>
            </Pressable>
          </View>
          {!notificationGranted ? <Text style={styles.hint}>{t.notificationDeniedHint}</Text> : null}
        </View>
      ) : null}

      <Pressable
        onPress={onNextStep}
        disabled={isLastStep && !consentAccepted}
        style={[styles.primaryButton, isLastStep && !consentAccepted && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>{isLastStep ? t.finish : t.next}</Text>
      </Pressable>
      <Text style={styles.secondaryText}>{`${stepIndex + 1}/${steps.length}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing[16],
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  chip: {
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  title: {
    ...theme.typography.heading5,
    color: theme.colors.semantic.textPrimary,
  },
  secondaryText: {
    ...theme.typography.body,
    color: theme.colors.semantic.textSecondary,
  },
  card: {
    padding: theme.spacing[16],
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    gap: theme.spacing[16],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.radius[8],
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.semantic.textSecondary,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.semantic.brandPrimary,
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.4,
  },
});
