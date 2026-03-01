import { describe, expect, it } from 'vitest';
import { resolveInitialPhase } from './auth-flow';

describe('resolveInitialPhase', () => {
  it('returns app when user is logged in', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: true,
      isGuestMode: false,
      hasCompletedOnboarding: false,
      hasSeenPermissionScreen: false,
      hasSeenSplashOnce: true,
      email: 'test@example.com',
      emailVerified: true,
    });

    expect(phase).toBe('app');
  });

  it('returns signin when onboarding is completed but user is not logged in', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: false,
      isGuestMode: false,
      hasCompletedOnboarding: true,
      hasSeenPermissionScreen: true,
      hasSeenSplashOnce: true,
      email: '',
      emailVerified: false,
    });

    expect(phase).toBe('signin');
  });

  it('returns signin when session email exists but login flag is false', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: false,
      isGuestMode: false,
      hasCompletedOnboarding: true,
      hasSeenPermissionScreen: true,
      hasSeenSplashOnce: true,
      email: 'suleyman@example.com',
      emailVerified: true,
    });

    expect(phase).toBe('signin');
  });

  it('returns onboarding on fresh install state', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: false,
      isGuestMode: false,
      hasCompletedOnboarding: false,
      hasSeenPermissionScreen: false,
      hasSeenSplashOnce: false,
      email: '',
      emailVerified: false,
    });

    expect(phase).toBe('onboarding');
  });

  it('returns app when guest mode is enabled', () => {
    const phase = resolveInitialPhase({
      isLoggedIn: false,
      isGuestMode: true,
      hasCompletedOnboarding: true,
      hasSeenPermissionScreen: false,
      hasSeenSplashOnce: true,
      email: '',
      emailVerified: true,
    });

    expect(phase).toBe('app');
  });
});
