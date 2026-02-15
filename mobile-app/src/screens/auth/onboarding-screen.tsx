import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/button';
import { LogoBadge } from '../../components/ui/logo-badge';
import { SlideIndicator } from '../../components/ui/slide-indicator';
import { type Locale, getTranslations } from '../../features/localization/localization';
import { getOnboardingSteps } from '../../features/onboarding/onboarding-steps';
import { theme } from '../../theme';

type OnboardingScreenProps = {
  locale: Locale;
  stepIndex: number;
  onNextStep: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({ locale, stepIndex, onNextStep, onSkip }: OnboardingScreenProps) {
  const t = getTranslations(locale);
  const steps = getOnboardingSteps(locale);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.sideSpacer} />
        <View style={styles.sideSpacer}>
          <Pressable onPress={onSkip}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>
      </View>

      {stepIndex === 0 ? <LogoBadge /> : null}

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{step.heroEmoji}</Text>
      </View>

      <SlideIndicator count={steps.length} activeIndex={stepIndex} />

      <View style={styles.copyBlock}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      <Button label={isLastStep ? (locale === 'tr' ? 'Create an account' : 'Create an account') : t.next} onPress={onNextStep} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[8],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideSpacer: {
    minWidth: 52,
    alignItems: 'flex-end',
  },
  skip: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  hero: {
    minHeight: 220,
    borderRadius: theme.radius[24],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.card,
  },
  heroEmoji: {
    fontSize: 84,
  },
  copyBlock: {
    gap: theme.spacing[8],
  },
  title: {
    ...theme.typography.heading.h4Medium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
});
