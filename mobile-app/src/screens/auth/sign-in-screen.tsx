import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { type Locale } from '../../features/localization/localization';
import { theme } from '../../theme';

type SignInScreenProps = {
  locale: Locale;
  onSuccess: () => void;
  onOpenSignUp: () => void;
};

export function SignInScreen({ locale, onSuccess, onOpenSignUp }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');

  const canSubmit = useMemo(() => email.includes('@') && password.trim().length >= 6, [email, password]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Enter your credentials to continue</Text>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <View style={styles.form}>
        <TextField label="Email" value={email} placeholder="Enter your email address" onChangeText={setEmail} />
        <TextField label="Password" value={password} secureTextEntry placeholder="Enter your password" onChangeText={setPassword} />
      </View>

      <Button
        label="Sign in"
        onPress={() => {
          if (!canSubmit) {
            setErrorText(locale === 'tr' ? 'Gecerli email ve sifre giriniz.' : 'Please enter a valid email and password.');
            return;
          }
          setErrorText('');
          onSuccess();
        }}
      />

      <Text style={styles.legal}>By signing in, you agree to our Terms of Service and Privacy Policy.</Text>

      <Pressable onPress={onOpenSignUp}>
        <Text style={styles.signUpText}>{locale === 'tr' ? 'Hesabin yok mu? Sign up' : "Don't have an account? Sign up"}</Text>
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
