import type { UserRole } from '../auth/auth-session-store';

export const FREE_MEDICATION_LIMIT = 3;

export function canCreateMedication(role: UserRole, medicationCount: number): boolean {
  if (role === 'vip') {
    return true;
  }

  return medicationCount < FREE_MEDICATION_LIMIT;
}
