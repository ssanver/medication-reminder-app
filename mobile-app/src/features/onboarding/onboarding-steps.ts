import type { Locale } from '../localization/localization';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  heroEmoji: string;
};

export function getOnboardingSteps(locale: Locale): OnboardingStep[] {
  if (locale === 'tr') {
    return [
      {
        id: 'wellbeing',
        title: 'Sagligin her zaman kontrolunde',
        description: 'Ilac hatirlatmalarini tek ekrandan kolayca yonet.',
        heroEmoji: '🧑‍⚕️',
      },
      {
        id: 'reminders',
        title: 'Akilli ve kolay hatirlatmalar',
        description: 'Doz takibini alindi, alinamadi ve ertelendi olarak kaydet.',
        heroEmoji: '📱',
      },
      {
        id: 'family',
        title: 'Kendin ve ailen icin',
        description: 'Birden fazla profil ile herkesin planini tek uygulamada yonet.',
        heroEmoji: '👥',
      },
    ];
  }

  return [
    {
      id: 'wellbeing',
      title: 'Your health on schedule',
      description: 'Manage medication reminders from one simple flow.',
      heroEmoji: '🧑‍⚕️',
    },
    {
      id: 'reminders',
      title: 'Advanced reminders, easy use',
      description: 'Track doses as taken, missed or snoozed in one tap.',
      heroEmoji: '📱',
    },
    {
      id: 'family',
      title: 'For yourself, family and friends',
      description: 'Use multi-profile support to manage everyone in one app.',
      heroEmoji: '👥',
    },
  ];
}

export function isOnboardingStepCountValid(steps: OnboardingStep[]): boolean {
  return steps.length <= 5 && steps.length > 0;
}
