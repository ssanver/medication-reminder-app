import type { AuthSession } from './auth-session-store';

export type InitialPhase = 'onboarding' | 'signin' | 'app';

export function resolveInitialPhase(session: AuthSession): InitialPhase {
  if (session.isLoggedIn || session.isGuestMode) {
    return 'app';
  }

  if (session.hasCompletedOnboarding) {
    return 'signin';
  }

  return 'onboarding';
}
