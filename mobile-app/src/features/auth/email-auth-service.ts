import { apiRequestJson, apiRequestVoid } from '../network/api-client';

type EmailAuthResponse = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export async function signUpWithEmail(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<EmailAuthResponse> {
  return apiRequestJson<EmailAuthResponse>('/api/auth/email/sign-up', {
    method: 'POST',
    correlationPrefix: 'email-signup',
    body: payload,
  });
}

export async function signInWithEmail(payload: { email: string; password: string }): Promise<EmailAuthResponse> {
  return apiRequestJson<EmailAuthResponse>('/api/auth/email/sign-in', {
    method: 'POST',
    correlationPrefix: 'email-signin',
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
