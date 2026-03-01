import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandIcon } from '../../components/ui/brand-icon';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { useSignInScreenState } from '../../features/auth/application/use-sign-in-screen-state';
import { getTranslations, type Locale } from '../../features/localization/localization';
import { type SocialLoginResult } from '../../features/auth/social-auth';
import { theme } from '../../theme';

type AuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

type SignInScreenProps = {
  locale: Locale;
  onSuccess: (payload: { session?: SocialLoginResult | AuthSessionTokens; email: string; emailVerified: boolean; role: 'visitor' | 'member' | 'vip' }) => void;
  onOpenSignUp: () => void;
  onContinueAsGuest: () => void;
};

export function SignInScreen({ locale, onSuccess, onOpenSignUp, onContinueAsGuest }: SignInScreenProps) {
  const t = getTranslations(locale);
  const {
    email,
    setEmail,
    password,
    setPassword,
    isPasswordHidden,
    setIsPasswordHidden,
    canSubmit,
    errorText,
    socialMessage,
    isSocialLoading,
    isLoading,
    signIn,
    signInWithSocial,
  } = useSignInScreenState({ onSuccess, t });
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.signInTitle}</Text>
      <Text style={styles.subtitle}>{t.signInSubtitle}</Text>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {socialMessage ? <Text style={styles.successText}>{socialMessage}</Text> : null}

      <View style={styles.form}>
        <TextField testID="signin-email-input" label={t.email} value={email} placeholder={t.enterYourEmail} onChangeText={setEmail} />
        <TextField
          testID="signin-password-input"
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
        testID="signin-submit-button"
        label={t.signIn}
        onPress={() => void signIn()}
        disabled={isLoading || !canSubmit}
      />

      <Text style={styles.legal}>{t.termsText}</Text>
      <Button
        label={t.continueWithApple}
        leadingNode={<BrandIcon name="apple" />}
        variant="outlined"
        onPress={() => void signInWithSocial('Apple')}
        disabled={isSocialLoading}
      />
      <Button
        label={t.continueWithGoogle}
        leadingNode={<BrandIcon name="google" />}
        variant="outlined"
        onPress={() => void signInWithSocial('Google')}
        disabled={isSocialLoading}
      />
      <Button label={t.continueAsGuest} variant="ghost" onPress={onContinueAsGuest} />

      <Pressable testID="signin-open-signup-link" onPress={onOpenSignUp} style={styles.signUpCta}>
        <Text style={styles.signUpHint}>{t.noAccount}</Text>
        <Text style={styles.signUpText}>{t.createAccount}</Text>
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
  signUpCta: {
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[300],
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.primaryBlue[50],
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  signUpHint: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  signUpText: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.primaryBlue[700],
    textAlign: 'center',
  },
});
