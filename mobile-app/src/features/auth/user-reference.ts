import { loadAuthSession } from './auth-session-store';

export async function resolveUserReference(): Promise<string> {
  const session = await loadAuthSession();
  const sessionEmail = session.email.trim().toLowerCase();
  if (sessionEmail.length > 0) {
    return sessionEmail;
  }

  throw new Error('Authenticated user reference is missing.');
}

export async function buildUserReferenceQuery(): Promise<string> {
  const userReference = await resolveUserReference();
  return `?userReference=${encodeURIComponent(userReference)}`;
}
