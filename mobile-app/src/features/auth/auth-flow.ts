import type { AuthSession } from './auth-session-store';

export type InitialPhase = 'signin' | 'app';

export function resolveInitialPhase(session: AuthSession): InitialPhase {
  return 'app';
}
