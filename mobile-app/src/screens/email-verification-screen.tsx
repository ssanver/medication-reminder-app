import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type EmailVerificationScreenProps = {
  locale: Locale;
  email: string;
  initialCooldownSeconds: number;
  onBack: () => void;
  onVerify: (code: string) => Promise<{ ok: boolean; message: string }>;
  onResend: () => Promise<{ ok: boolean; message: string; cooldownSeconds: number }>;
};

export function EmailVerificationScreen({
  locale,
  email,
  initialCooldownSeconds,
  onBack,
  onVerify,
  onResend,
}: EmailVerificationScreenProps) {
  const t = getTranslations(locale);
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
      setMessage(t.enterSixDigitCode);
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
        <ScreenHeader title={t.emailVerification} leftAction={{ icon: 'back', onPress: onBack }} />

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeIconWrap}>
              <Text style={styles.badgeIcon}>✉️</Text>
            </View>
            <View style={styles.badgeTextWrap}>
              <Text style={styles.cardTitle}>
                {t.verifyYourAccount}
              </Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{t.whyRequired}</Text>
            <Text style={styles.warningText}>{t.emailVerificationWhyBody}</Text>
          </View>

          <Button label={t.enterVerificationCode} onPress={() => setSheetOpen(true)} />
          <Button
            label={
              cooldownSeconds > 0
                ? t.resendVerificationEmailCountdown.replace('{{seconds}}', `${cooldownSeconds}`)
                : t.resendVerificationEmail
            }
            variant="outlined"
            onPress={() => void handleResend()}
            disabled={cooldownSeconds > 0 || busy}
          />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </ScrollView>

      <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
        >
          <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{t.emailVerification}</Text>
            <Text style={styles.sheetDescription}>{t.emailCodePrompt}</Text>
            <TextInput
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              style={styles.codeInput}
              maxLength={6}
              textAlign="center"
              autoFocus
              returnKeyType="done"
            />
            <Button label={t.verify} onPress={() => void handleVerify()} disabled={busy} />
            <Pressable onPress={() => void handleResend()} disabled={cooldownSeconds > 0 || busy}>
              <Text style={[styles.resendText, (cooldownSeconds > 0 || busy) && styles.resendTextDisabled]}>
                {cooldownSeconds > 0
                  ? t.resendCodeCountdown.replace('{{seconds}}', `${cooldownSeconds}`)
                  : t.resendCode}
              </Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
  message: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[600],
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.semantic.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    backgroundColor: theme.colors.semantic.cardBackground,
    minHeight: '50%',
    maxHeight: '60%',
    padding: theme.spacing[16],
    gap: theme.spacing[8],
    justifyContent: 'flex-start',
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
