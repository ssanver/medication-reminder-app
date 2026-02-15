import type { Locale } from '../localization/localization';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
};

export function getOnboardingSteps(locale: Locale): OnboardingStep[] {
  if (locale === 'tr') {
    return [
      {
        id: 'value',
        title: 'Ilaclarini duzenli takip et',
        description: 'Gunluk ve haftalik planlari kolayca olustur.',
      },
      {
        id: 'actions',
        title: 'Bildirimleri yonet',
        description: 'Aldim, almadim ve ertele aksiyonlari tek dokunusla kullan.',
      },
      {
        id: 'history',
        title: 'Gecmisi gor',
        description: 'Tedavi uyumunu gunluk ve haftalik ozetlerle izle.',
      },
      {
        id: 'consent',
        title: 'Aydinlatma ve riza',
        description: 'Kisisel verilerin KVKK kapsaminda nasil islendigi aciklanir.',
      },
    ];
  }

  return [
    {
      id: 'value',
      title: 'Track medications regularly',
      description: 'Create daily and weekly plans quickly.',
    },
    {
      id: 'actions',
      title: 'Manage reminders',
      description: 'Use taken, missed, and snooze actions in one tap.',
    },
    {
      id: 'history',
      title: 'Review history',
      description: 'See adherence with daily and weekly summaries.',
    },
    {
      id: 'consent',
      title: 'Consent and privacy',
      description: 'We explain how personal data is processed.',
    },
  ];
}

export function isOnboardingStepCountValid(steps: OnboardingStep[]): boolean {
  return steps.length <= 5 && steps.length > 0;
}
