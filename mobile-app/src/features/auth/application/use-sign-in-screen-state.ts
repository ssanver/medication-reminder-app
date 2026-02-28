import { useMemo, useState } from 'react';
import { signInWithEmail } from '../email-auth-service';
import { loginWithSocial, type SocialLoginResult } from '../social-auth';

type AuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

type UseSignInScreenStateInput = {
  onSuccess: (payload: { session?: SocialLoginResult | AuthSessionTokens; email: string; emailVerified: boolean }) => void;
  t: {
    pleaseFillAllFields: string;
    socialSignInSuccessPrefix: string;
    socialSignInFailedPrefix: string;
  };
};

export function useSignInScreenState({ onSuccess, t }: UseSignInScreenStateInput) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [socialMessage, setSocialMessage] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length >= 6, [email, password]);

  async function signIn() {
    if (!canSubmit) {
      setErrorText(t.pleaseFillAllFields);
      return;
    }

    setIsLoading(true);
    setErrorText('');
    try {
      const response = await signInWithEmail({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!response.accessToken?.trim() || !response.refreshToken?.trim() || !response.email?.trim()) {
        throw new Error('Oturum oluşturulamadı. Lütfen tekrar giriş yapın.');
      }
      onSuccess({
        session: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
        email: response.email,
        emailVerified: response.isEmailVerified,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithSocial(provider: 'Apple' | 'Google') {
    try {
      setIsSocialLoading(true);
      setErrorText('');
      const response = await loginWithSocial(provider);
      setSocialMessage(`${t.socialSignInSuccessPrefix} ${response.provider}.`);
      setTimeout(() => onSuccess({ session: response, email: response.email, emailVerified: true }), 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Social login failed.';
      setErrorText(`${t.socialSignInFailedPrefix} ${message}`);
    } finally {
      setIsSocialLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    canSubmit,
    isPasswordHidden,
    setIsPasswordHidden,
    errorText,
    socialMessage,
    isSocialLoading,
    isLoading,
    signIn,
    signInWithSocial,
  };
}
