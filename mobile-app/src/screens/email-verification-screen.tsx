import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type EmailVerificationScreenProps = {
  locale: Locale;
  email: string;
  initialCooldownSeconds: number;
  onBack: () => void;
  onVerify: (code: string) => Promise<{ ok: boolean; message: string }>;
  onResend: () => Promise<{ ok: boolean; message: string; cooldownSeconds: number }>;
  onCancelSignUp: () => void;
};

export function EmailVerificationScreen({
  locale,
  email,
  initialCooldownSeconds,
  onBack,
  onVerify,
  onResend,
  onCancelSignUp,
}: EmailVerificationScreenProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(initialCooldownSeconds);

  useEffect(() => {
    setCooldownSeconds(initialCooldownSeconds);
  }, [initialCooldownSeconds]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleVerify() {
    if (code.trim().length !== 6) {
      setMessage(locale === 'tr' ? 'Lütfen 6 haneli kod girin.' : 'Please enter a 6-digit code.');
      return;
    }

    setBusy(true);
    const result = await onVerify(code.trim());
    setBusy(false);
    setMessage(result.message);
    if (result.ok) {
      setSheetOpen(false);
    }
  }

  async function handleResend() {
    if (cooldownSeconds > 0 || busy) {
      return;
    }

    setBusy(true);
    const result = await onResend();
    setBusy(false);
    setCooldownSeconds(result.cooldownSeconds);
    setMessage(result.message);
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <ScreenHeader title={locale === 'tr' ? 'E-posta Doğrulama' : 'Email Verification'} leftAction={{ icon: '<', onPress: onBack }} />

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeIconWrap}>
              <Text style={styles.badgeIcon}>✉️</Text>
            </View>
            <View style={styles.badgeTextWrap}>
              <Text style={styles.cardTitle}>
                {locale === 'tr' ? 'Hesabınızı doğrulayın' : 'Verify your account'}
              </Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{locale === 'tr' ? 'Neden gerekli?' : 'Why this is required?'}</Text>
            <Text style={styles.warningText}>
              {locale === 'tr'
                ? 'E-postanızı doğruladığınızda verileriniz güvenli şekilde hesabınıza bağlanır ve cihaz değiştirseniz bile korunur.'
                : 'When you verify your email, your data is securely linked to your account and stays available across devices.'}
            </Text>
          </View>

          <Button label={locale === 'tr' ? 'Onay kodunu gir' : 'Enter verification code'} onPress={() => setSheetOpen(true)} />
          <Button
            label={
              cooldownSeconds > 0
                ? locale === 'tr'
                  ? `Onay e-postasını yeniden gönder (${cooldownSeconds}s)`
                  : `Resend verification email (${cooldownSeconds}s)`
                : locale === 'tr'
                  ? 'Onay e-postasını yeniden gönder'
                  : 'Resend verification email'
            }
            variant="outlined"
            onPress={() => void handleResend()}
            disabled={cooldownSeconds > 0 || busy}
          />
          <View style={styles.separator} />
          <Button label={locale === 'tr' ? 'Kaydı iptal et' : 'Cancel sign up'} variant="danger" onPress={onCancelSignUp} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </ScrollView>

      <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{locale === 'tr' ? 'E-posta Doğrulama' : 'Email Verification'}</Text>
            <Text style={styles.sheetDescription}>
              {locale === 'tr' ? 'Mailinize gönderilen 6 haneli kodu girin.' : 'Enter the 6-digit code sent to your email.'}
            </Text>
            <TextInput
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              style={styles.codeInput}
              maxLength={6}
              textAlign="center"
            />
            <Button label={locale === 'tr' ? 'Doğrula' : 'Verify'} onPress={() => void handleVerify()} disabled={busy} />
            <Pressable onPress={() => void handleResend()} disabled={cooldownSeconds > 0 || busy}>
              <Text style={[styles.resendText, (cooldownSeconds > 0 || busy) && styles.resendTextDisabled]}>
                {cooldownSeconds > 0
                  ? locale === 'tr'
                    ? `Kodu yeniden gönder (${cooldownSeconds}s)`
                    : `Resend code (${cooldownSeconds}s)`
                  : locale === 'tr'
                    ? 'Kodu yeniden gönder'
                    : 'Resend code'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    gap: theme.spacing[16],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryBlue[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  infoBlock: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
    gap: theme.spacing[4],
  },
  infoLabel: {
    ...theme.typography.captionScale.lRegular,
    fontWeight: '700',
    color: theme.colors.semantic.textPrimary,
  },
  emailText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  warningText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.semantic.divider,
  },
  message: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[600],
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.semantic.overlay,
  },
  sheet: {
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  sheetTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  sheetDescription: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  codeInput: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[16],
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    letterSpacing: 4,
  },
  resendText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
    textAlign: 'center',
  },
  resendTextDisabled: {
    color: theme.colors.semantic.textMuted,
  },
});
