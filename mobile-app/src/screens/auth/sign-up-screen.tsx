import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { type Locale } from '../../features/localization/localization';
import { theme } from '../../theme';

type SignUpScreenProps = {
  locale: Locale;
  onSuccess: () => void;
  onOpenSignIn: () => void;
};

export function SignUpScreen({ locale, onSuccess, onOpenSignIn }: SignUpScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [socialMessage, setSocialMessage] = useState('');

  const canSubmit = useMemo(() => name.trim().length > 1 && email.includes('@') && password.trim().length >= 6, [name, email, password]);

  function handleSocialAuth(provider: 'Apple' | 'Google') {
    setErrorText('');
    setSocialMessage(locale === 'tr' ? `${provider} ile giris basarili.` : `Signed in with ${provider}.`);
    setTimeout(() => onSuccess(), 500);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.subtitle}>Fill in the details to create your account</Text>

      {showSuccess ? (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>Sign Up Completed!</Text>
          <Text style={styles.successText}>Account has been created successfully.</Text>
        </View>
      ) : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {socialMessage ? <Text style={styles.successInline}>{socialMessage}</Text> : null}

      <View style={styles.form}>
        <TextField label="Name" value={name} placeholder="Enter your name" onChangeText={setName} />
        <TextField label="Email" value={email} placeholder="Enter your email address" onChangeText={setEmail} />
        <TextField
          label="Password"
          value={password}
          secureTextEntry
          placeholder="Enter your desired password"
          trailingIcon="o"
          onChangeText={setPassword}
        />
      </View>

      <Button
        label="Create an account"
        onPress={() => {
          if (!canSubmit) {
            setErrorText(locale === 'tr' ? 'Lutfen tum alanlari dogru doldurun.' : 'Please enter valid name, email and password.');
            return;
          }
          setErrorText('');
          setShowSuccess(true);
          setTimeout(() => onSuccess(), 800);
        }}
      />

      <Text style={styles.legal}>By signing in, you agree to our Terms of Service and Privacy Policy.</Text>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.divider} />
      </View>
      <Button label="Continue with Apple" variant="outlined" onPress={() => handleSocialAuth('Apple')} />
      <Button label="Continue with Google" variant="outlined" onPress={() => handleSocialAuth('Google')} />
      <Pressable onPress={onOpenSignIn}>
        <Text style={styles.signInText}>{locale === 'tr' ? 'Zaten hesabin var mi? Sign in' : 'Already have an account? Sign in'}</Text>
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
