import type { AuthSession } from './auth-session-store';

export type InitialPhase = 'onboarding' | 'signin' | 'app';

export function resolveInitialPhase(session: AuthSession): InitialPhase {
  const hasSessionEmail = session.email.trim().length > 0;
  if (session.isLoggedIn || hasSessionEmail) {
    return 'app';
  }

  if (session.hasCompletedOnboarding) {
    return 'signin';
  }

  return 'onboarding';
}
