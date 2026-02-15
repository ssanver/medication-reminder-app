import { getTranslations, type Locale } from '../localization/localization';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  heroEmoji: string;
};

const heroEmojiById: Record<string, string> = {
  wellbeing: '🧑‍⚕️',
  reminders: '📱',
  family: '👥',
};

export function getOnboardingSteps(locale: Locale): OnboardingStep[] {
  return getTranslations(locale).onboardingSteps.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    heroEmoji: heroEmojiById[item.id] ?? '📱',
  }));
}

export function isOnboardingStepCountValid(steps: OnboardingStep[]): boolean {
  return steps.length <= 5 && steps.length > 0;
}
