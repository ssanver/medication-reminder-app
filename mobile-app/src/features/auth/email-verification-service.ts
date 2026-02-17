import { apiRequestJson } from '../network/api-client';

type EmailVerificationRequestResponse = {
  email: string;
  sent: boolean;
  resendAvailableInSeconds?: number;
  expiresAt: string;
  debugCode?: string;
};

type EmailVerificationStatusResponse = {
  email: string;
  isVerified: boolean;
  resendAvailableInSeconds?: number;
  lockedUntil?: string;
  expiresAt?: string;
};

type VerifyEmailCodeResponse = {
  email: string;
  isVerified: boolean;
};

export async function requestEmailVerification(email: string): Promise<EmailVerificationRequestResponse> {
  return apiRequestJson<EmailVerificationRequestResponse>('/api/auth/email/request-verification', {
    method: 'POST',
    correlationPrefix: 'email-verify',
    body: { email },
  });
}

export async function resendEmailVerification(email: string): Promise<EmailVerificationRequestResponse> {
  return apiRequestJson<EmailVerificationRequestResponse>('/api/auth/email/resend-verification', {
    method: 'POST',
    correlationPrefix: 'email-resend',
    body: { email },
  });
}

export async function verifyEmailCode(email: string, code: string): Promise<VerifyEmailCodeResponse> {
  return apiRequestJson<VerifyEmailCodeResponse>('/api/auth/email/verify-code', {
    method: 'POST',
    correlationPrefix: 'email-code',
    body: { email, code },
  });
}

export async function getEmailVerificationStatus(email: string): Promise<EmailVerificationStatusResponse> {
  const encodedEmail = encodeURIComponent(email);
  return apiRequestJson<EmailVerificationStatusResponse>(`/api/auth/email/verification-status?email=${encodedEmail}`, {
    method: 'GET',
    correlationPrefix: 'email-status',
  });
}
