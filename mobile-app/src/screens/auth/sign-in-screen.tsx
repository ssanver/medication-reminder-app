import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandIcon } from '../../components/ui/brand-icon';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { getTranslations, type Locale } from '../../features/localization/localization';
import { loginWithSocial } from '../../features/auth/social-auth';
import { theme } from '../../theme';

type SignInScreenProps = {
  locale: Locale;
  onSuccess: () => void;
  onOpenSignUp: () => void;
};

export function SignInScreen({ locale, onSuccess, onOpenSignUp }: SignInScreenProps) {
  const t = getTranslations(locale);
  const [email, setEmail] = useState('suleymansanver@gmail.com');
  const [password, setPassword] = useState('123456');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [socialMessage, setSocialMessage] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length >= 6, [email, password]);

  async function handleSocialAuth(provider: 'Apple' | 'Google') {
    try {
      setIsSocialLoading(true);
      setErrorText('');
      const response = await loginWithSocial(provider);
      setSocialMessage(`${t.socialSignInSuccessPrefix} ${response.provider}.`);
      setTimeout(() => onSuccess(), 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Social login failed.';
      setErrorText(`${t.socialSignInFailedPrefix} ${message}`);
    } finally {
      setIsSocialLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.signInTitle}</Text>
      <Text style={styles.subtitle}>{t.signInSubtitle}</Text>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {socialMessage ? <Text style={styles.successText}>{socialMessage}</Text> : null}

      <View style={styles.form}>
        <TextField label={t.email} value={email} placeholder={t.enterYourEmail} onChangeText={setEmail} />
        <TextField
          label={t.password}
          value={password}
          secureTextEntry={isPasswordHidden}
          placeholder={t.enterYourPassword}
          trailingIcon={isPasswordHidden ? '👁' : '🙈'}
          onTrailingPress={() => setIsPasswordHidden((prev) => !prev)}
          onChangeText={setPassword}
        />
      </View>

      <Button
        label={t.signIn}
        onPress={() => {
          if (!canSubmit) {
            setErrorText(t.pleaseFillAllFields);
            return;
          }
          setErrorText('');
          onSuccess();
        }}
      />

      <Text style={styles.legal}>{t.termsText}</Text>
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

      <Pressable onPress={onOpenSignUp}>
        <Text style={styles.signUpText}>{t.noAccount}</Text>
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
  title: {
    ...theme.typography.heading.h4Medium,
    color: theme.colors.semantic.textPrimary,
  },
  subtitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  errorText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
    textAlign: 'center',
  },
  successText: {
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
  signUpText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
});
