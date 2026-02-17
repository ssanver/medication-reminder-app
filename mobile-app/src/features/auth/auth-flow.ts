import type { AuthSession } from './auth-session-store';

export type InitialPhase = 'onboarding' | 'signin' | 'app';

export function resolveInitialPhase(session: AuthSession): InitialPhase {
  if (session.isLoggedIn) {
    return 'app';
  }

  if (session.hasCompletedOnboarding) {
    return 'signin';
  }

  return 'onboarding';
}
