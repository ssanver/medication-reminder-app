import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { TextField } from '../components/ui/text-field';
import { loadAuthSession } from '../features/auth/auth-session-store';
import { changePassword } from '../features/auth/email-auth-service';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type ChangePasswordScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function ChangePasswordScreen({ locale, onBack }: ChangePasswordScreenProps) {
  const t = getTranslations(locale);
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

  async function onSave() {
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
      const message = error instanceof Error ? error.message : locale === 'tr' ? 'Şifre güncelleme başarısız.' : 'Password update failed.';
      setMessage('');
      setErrorText(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.changePassword} leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.card}>
        <TextField
          label={locale === 'tr' ? 'Mevcut şifre' : 'Current password'}
          value={currentPassword}
          placeholder={t.enterYourPassword}
          secureTextEntry={isHidden}
          trailingIcon={isHidden ? '👁' : '🙈'}
          onTrailingPress={() => setIsHidden((prev) => !prev)}
          onChangeText={setCurrentPassword}
        />
        <TextField
          label={locale === 'tr' ? 'Yeni şifre' : 'New password'}
          value={newPassword}
          placeholder={t.enterYourDesiredPassword}
          secureTextEntry={isHidden}
          trailingIcon={isHidden ? '👁' : '🙈'}
          onTrailingPress={() => setIsHidden((prev) => !prev)}
          onChangeText={setNewPassword}
        />
        <TextField
          label={locale === 'tr' ? 'Yeni şifre (tekrar)' : 'Confirm new password'}
          value={confirmPassword}
          placeholder={locale === 'tr' ? 'Yeni şifrenizi tekrar girin' : 'Re-enter your new password'}
          secureTextEntry={isHidden}
          trailingIcon={isHidden ? '👁' : '🙈'}
          onTrailingPress={() => setIsHidden((prev) => !prev)}
          onChangeText={setConfirmPassword}
        />

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <Button label={t.saveChanges} onPress={() => void onSave()} disabled={!canSave || isSaving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[24],
  },
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  errorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
  },
  successText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.success[500],
  },
});
