import { describe, expect, it } from 'vitest';
import { getOnboardingSteps, isOnboardingStepCountValid } from './onboarding-steps';

describe('onboarding-steps', () => {
  it('maximum 5 adim kuralina uyar', () => {
    const trSteps = getOnboardingSteps('tr');
    const enSteps = getOnboardingSteps('en');

    expect(isOnboardingStepCountValid(trSteps)).toBe(true);
    expect(isOnboardingStepCountValid(enSteps)).toBe(true);
  });

  it('TR ve EN adim sayilari esit olmali', () => {
    const trSteps = getOnboardingSteps('tr');
    const enSteps = getOnboardingSteps('en');

    expect(trSteps).toHaveLength(enSteps.length);
  });
});
