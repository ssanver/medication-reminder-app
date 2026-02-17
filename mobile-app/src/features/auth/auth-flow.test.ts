import { describe, expect, it } from 'vitest';
import { resolveInitialPhase } from './auth-flow';

describe('resolveInitialPhase', () => {
  it('returns app when user is logged in', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: true,
      hasCompletedOnboarding: false,
      hasSeenPermissionScreen: false,
      email: 'test@example.com',
      emailVerified: true,
    });

    expect(phase).toBe('app');
  });

  it('returns signin when onboarding is completed but user is not logged in', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: false,
      hasCompletedOnboarding: true,
      hasSeenPermissionScreen: true,
      email: '',
      emailVerified: false,
    });

    expect(phase).toBe('signin');
  });

  it('returns onboarding on fresh install state', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: false,
      hasCompletedOnboarding: false,
      hasSeenPermissionScreen: false,
      email: '',
      emailVerified: false,
    });

    expect(phase).toBe('onboarding');
  });
});
