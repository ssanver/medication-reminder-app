import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandIcon } from '../../components/ui/brand-icon';
import { Button } from '../../components/ui/button';
import { IconButton } from '../../components/ui/icon-button';
import { TextField } from '../../components/ui/text-field';
import { useSignUpScreenState } from '../../features/auth/application/use-sign-up-screen-state';
import { getTranslations, type Locale } from '../../features/localization/localization';
import { type SocialLoginResult } from '../../features/auth/social-auth';
import { theme } from '../../theme';

type SignUpScreenProps = {
  locale: Locale;
  onSuccess: (payload: { session?: SocialLoginResult; email: string; emailVerified: boolean }) => void;
  onOpenSignIn: () => void;
  onBack: () => void;
};

export function SignUpScreen({ locale, onSuccess, onOpenSignIn, onBack }: SignUpScreenProps) {
  const t = getTranslations(locale);
  const {
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
  } = useSignUpScreenState({ onSuccess, t });
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <IconButton testID="signup-back-button" icon="back" variant="outlined" onPress={onBack} />
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
        <TextField testID="signup-name-input" label={t.name} value={name} placeholder={t.enterYourName} onChangeText={setName} />
        <TextField testID="signup-email-input" label={t.email} value={email} placeholder={t.enterYourEmail} onChangeText={setEmail} />
        <TextField
          testID="signup-password-input"
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
        testID="signup-submit-button"
        label={t.createAccount}
        onPress={() => void signUp()}
        disabled={isLoading || !canSubmit}
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
        onPress={() => void signUpWithSocial('Apple')}
        disabled={isSocialLoading}
      />
      <Button
        label={t.continueWithGoogle}
        leadingNode={<BrandIcon name="google" />}
        variant="outlined"
        onPress={() => void signUpWithSocial('Google')}
        disabled={isSocialLoading}
      />
      <Pressable testID="signup-open-signin-link" onPress={onOpenSignIn}>
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
