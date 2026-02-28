import { useMemo, useState } from 'react';
import { loadAuthSession } from '../auth-session-store';
import { changePassword } from '../email-auth-service';
import { type Locale } from '../../localization/localization';

type UseChangePasswordScreenStateInput = {
  locale: Locale;
  t: {
    pleaseFillAllFields: string;
  };
};

export function useChangePasswordScreenState({ locale, t }: UseChangePasswordScreenStateInput) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isHidden, setIsHidden] = useState(true);
  const [message, setMessage] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => currentPassword.trim().length > 0 && newPassword.trim().length >= 6 && confirmPassword.trim().length >= 6,
    [currentPassword, newPassword, confirmPassword],
  );

  async function save() {
    if (!canSave) {
      setMessage('');
      setErrorText(t.pleaseFillAllFields);
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setMessage('');
      setErrorText(locale === 'tr' ? 'Yeni şifre ve tekrar şifre aynı olmalıdır.' : 'New password and confirmation must match.');
      return;
    }

    const session = await loadAuthSession();
    if (!session.email) {
      setMessage('');
      setErrorText(locale === 'tr' ? 'Oturum e-posta bilgisi bulunamadı.' : 'Session email was not found.');
      return;
    }

    setIsSaving(true);
    setErrorText('');
    try {
      await changePassword({
        email: session.email,
        currentPassword,
        newPassword,
      });
      setMessage(locale === 'tr' ? 'Şifre başarıyla güncellendi.' : 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const value = error instanceof Error ? error.message : locale === 'tr' ? 'Şifre güncelleme başarısız.' : 'Password update failed.';
      setMessage('');
      setErrorText(value);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isHidden,
    setIsHidden,
    message,
    errorText,
    isSaving,
    canSave,
    save,
  };
}
