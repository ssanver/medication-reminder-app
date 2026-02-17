import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandIcon } from '../../components/ui/brand-icon';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { getTranslations, type Locale } from '../../features/localization/localization';
import { loginWithSocial, type SocialLoginResult } from '../../features/auth/social-auth';
import { isSignUpFormValid } from '../../features/auth/signup-validation';
import { theme } from '../../theme';

type SignUpScreenProps = {
  locale: Locale;
  onSuccess: (session?: SocialLoginResult) => void;
  onOpenSignIn: () => void;
  onBack: () => void;
};

export function SignUpScreen({ locale, onSuccess, onOpenSignIn, onBack }: SignUpScreenProps) {
  const t = getTranslations(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [socialMessage, setSocialMessage] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const canSubmit = useMemo(() => isSignUpFormValid({ name, email, password }), [name, email, password]);

  async function handleSocialAuth(provider: 'Apple' | 'Google') {
    try {
      setIsSocialLoading(true);
      setErrorText('');
      const response = await loginWithSocial(provider);
      setSocialMessage(`${t.socialSignInSuccessPrefix} ${response.provider}.`);
      setTimeout(() => onSuccess(response), 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Social login failed.';
      setErrorText(`${t.socialSignInFailedPrefix} ${message}`);
    } finally {
      setIsSocialLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>{'<'}</Text>
      </Pressable>
      <Text style={styles.title}>{t.signUpTitle}</Text>
      <Text style={styles.subtitle}>{t.signUpSubtitle}</Text>

      {showSuccess ? (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>{t.successSignUp}</Text>
          <Text style={styles.successText}>{t.successSignUpDescription}</Text>
        </View>
      ) : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {socialMessage ? <Text style={styles.successInline}>{socialMessage}</Text> : null}

      <View style={styles.form}>
        <TextField label={t.name} value={name} placeholder={t.enterYourName} onChangeText={setName} />
        <TextField label={t.email} value={email} placeholder={t.enterYourEmail} onChangeText={setEmail} />
        <TextField
          label={t.password}
          value={password}
          secureTextEntry={isPasswordHidden}
          placeholder={t.enterYourDesiredPassword}
          trailingIcon={isPasswordHidden ? '👁' : '🙈'}
          onTrailingPress={() => setIsPasswordHidden((prev) => !prev)}
          onChangeText={setPassword}
        />
      </View>

      <Button
        label={t.createAccount}
        onPress={() => {
          if (!canSubmit) {
            setErrorText(t.pleaseFillAllFields);
            return;
          }
          setErrorText('');
          setShowSuccess(true);
          setTimeout(() => onSuccess(), 800);
        }}
      />

      <Text style={styles.legal}>{t.termsText}</Text>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.orText}>{t.or}</Text>
        <View style={styles.divider} />
      </View>
      <Button
        label={t.continueWithApple}
        leadingNode={<BrandIcon name="apple" />}
        variant="outlined"
        onPress={() => void handleSocialAuth('Apple')}
        disabled={isSocialLoading}
      />
      <Button
        label={t.continueWithGoogle}
        leadingNode={<BrandIcon name="google" />}
        variant="outlined"
        onPress={() => void handleSocialAuth('Google')}
        disabled={isSocialLoading}
      />
      <Pressable onPress={onOpenSignIn}>
        <Text style={styles.signInText}>{t.alreadyHaveAccount}</Text>
      </Pressable>
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
  backButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  title: {
    ...theme.typography.heading.h4Medium,
    color: theme.colors.semantic.textPrimary,
  },
  subtitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  successBanner: {
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.success[200],
    backgroundColor: theme.colors.success[50],
    padding: theme.spacing[8],
    gap: 2,
  },
  successTitle: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.success[800],
  },
  successText: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.success[800],
  },
  errorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
    textAlign: 'center',
  },
  successInline: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.success[500],
    textAlign: 'center',
  },
  form: {
    gap: theme.spacing[8],
  },
  legal: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.semantic.borderSoft,
  },
  orText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  signInText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
});
