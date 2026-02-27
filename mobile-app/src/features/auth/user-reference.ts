import { loadAuthSession } from './auth-session-store';
import { currentUser } from '../profile/current-user';

export async function resolveUserReference(): Promise<string> {
  const session = await loadAuthSession();
  const sessionEmail = session.email.trim().toLowerCase();
  if (sessionEmail.length > 0) {
    return sessionEmail;
  }

  return currentUser.email.trim().toLowerCase();
}

export async function buildUserReferenceQuery(): Promise<string> {
  const userReference = await resolveUserReference();
  return `?userReference=${encodeURIComponent(userReference)}`;
}
