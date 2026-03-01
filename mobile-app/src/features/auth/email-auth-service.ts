import { apiRequestJson, apiRequestVoid } from '../network/api-client';

type EmailAuthResponse = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  role: 'visitor' | 'member' | 'vip';
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type AuthSessionResponse = EmailAuthResponse;

export async function signUpWithEmail(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  deviceId?: string;
}): Promise<AuthSessionResponse> {
  return apiRequestJson<AuthSessionResponse>('/api/auth/email/sign-up', {
    method: 'POST',
    correlationPrefix: 'email-signup',
    body: payload,
  });
}

export async function signInWithEmail(payload: { email: string; password: string; deviceId?: string }): Promise<EmailAuthResponse> {
  return apiRequestJson<AuthSessionResponse>('/api/auth/email/sign-in', {
    method: 'POST',
    correlationPrefix: 'email-signin',
    body: payload,
  });
}

export async function createGuestSession(payload?: { deviceId?: string }): Promise<AuthSessionResponse> {
  return apiRequestJson<AuthSessionResponse>('/api/auth/guest/session', {
    method: 'POST',
    correlationPrefix: 'guest-session',
    body: payload,
  });
}

export async function changePassword(payload: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiRequestVoid('/api/auth/email/change-password', {
    method: 'POST',
    correlationPrefix: 'email-change-password',
    body: payload,
  });
}

export async function cancelAccount(payload: { email: string; password: string }): Promise<void> {
  await apiRequestVoid('/api/auth/email/cancel-account', {
    method: 'POST',
    correlationPrefix: 'email-cancel-account',
    body: payload,
  });
}
