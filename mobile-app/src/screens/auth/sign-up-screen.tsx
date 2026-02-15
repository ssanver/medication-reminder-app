import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { type Locale } from '../../features/localization/localization';
import { theme } from '../../theme';

type SignUpScreenProps = {
  locale: Locale;
  onSuccess: () => void;
};

export function SignUpScreen({ locale, onSuccess }: SignUpScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const canSubmit = useMemo(() => name.trim().length > 1 && email.includes('@') && password.length >= 8, [name, email, password]);

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
          setShowSuccess(true);
          setTimeout(() => onSuccess(), 800);
        }}
        disabled={!canSubmit}
      />

      <Text style={styles.legal}>By signing in, you agree to our Terms of Service and Privacy Policy.</Text>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.divider} />
      </View>
      <Button label="Continue with Apple" variant="outlined" onPress={() => undefined} />
      <Button label="Continue with Google" variant="outlined" onPress={() => undefined} />
      <Text style={styles.signInText}>{locale === 'tr' ? 'Zaten hesabin var mi? Sign in' : 'Already have an account? Sign in'}</Text>
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
