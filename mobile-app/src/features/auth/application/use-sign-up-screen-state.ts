import { useMemo, useState } from 'react';
import { signUpWithEmail } from '../email-auth-service';
import { loginWithSocial, type SocialLoginResult } from '../social-auth';
import { isSignUpFormValid } from '../signup-validation';

type AuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

type UseSignUpScreenStateInput = {
  onSuccess: (payload: { session?: SocialLoginResult | AuthSessionTokens; email: string; emailVerified: boolean }) => void;
  t: {
    pleaseFillAllFields: string;
    socialSignInSuccessPrefix: string;
    socialSignInFailedPrefix: string;
  };
};

export function useSignUpScreenState({ onSuccess, t }: UseSignUpScreenStateInput) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [socialMessage, setSocialMessage] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => isSignUpFormValid({ name, email, password }), [name, email, password]);

  async function signUp() {
    if (!canSubmit) {
      setErrorText(t.pleaseFillAllFields);
      return;
    }

    const fullName = name.trim();
    const nameParts = fullName.split(/\s+/).filter((item) => item.length > 0);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    if (!firstName) {
      setErrorText(t.pleaseFillAllFields);
      return;
    }

    setIsLoading(true);
    setErrorText('');
    try {
      const response = await signUpWithEmail({
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        password,
      });
      setShowSuccess(true);
      setTimeout(
        () =>
          onSuccess({
            session: {
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            },
            email: response.email,
            emailVerified: false,
          }),
        800,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-up failed.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function signUpWithSocial(provider: 'Apple' | 'Google') {
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
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    canSubmit,
    isPasswordHidden,
    setIsPasswordHidden,
    showSuccess,
    errorText,
    socialMessage,
    isSocialLoading,
    isLoading,
    signUp,
    signUpWithSocial,
  };
}
