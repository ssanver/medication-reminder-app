import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../theme';

type FieldState = 'default' | 'focused' | 'disabled' | 'error';

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  onTrailingPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onChangeText: (value: string) => void;
};

export function TextField({
  label,
  value,
  placeholder,
  helperText,
  errorText,
  secureTextEntry,
  editable = true,
  leadingIcon,
  trailingIcon,
  onTrailingPress,
  autoCapitalize = 'none',
  onChangeText,
}: TextFieldProps) {
  const state: FieldState = !editable ? 'disabled' : errorText ? 'error' : value.length > 0 ? 'focused' : 'default';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, state === 'error' && styles.labelError]}>{label}</Text>
      <View style={[styles.inputShell, shellStateStyles[state]]}>
        {leadingIcon ? <Text style={styles.leadingIcon}>{leadingIcon}</Text> : null}
        <TextInput
          value={value}
          editable={editable}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={theme.colors.neutral[400]}
          style={styles.input}
          onChangeText={onChangeText}
        />
        {trailingIcon ? (
          <Pressable onPress={onTrailingPress} style={styles.trailingButton}>
            <Text style={styles.trailingIcon}>{trailingIcon}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.helperText, state === 'error' && styles.errorText]}>{errorText ?? helperText ?? ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[4],
  },
  label: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  labelError: {
    color: theme.colors.error[500],
  },
  inputShell: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    gap: theme.spacing[8],
  },
  input: {
    flex: 1,
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
    paddingVertical: theme.spacing[8],
  },
  leadingIcon: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.neutral[500],
  },
  trailingButton: {
    minWidth: 24,
    alignItems: 'center',
  },
  trailingIcon: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.neutral[500],
  },
  helperText: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
    minHeight: 12,
  },
  errorText: {
    color: theme.colors.error[500],
  },
});

const shellStateStyles = StyleSheet.create({
  default: {
    borderColor: theme.colors.neutral[300],
  },
  focused: {
    borderColor: theme.colors.primaryBlue[500],
  },
  disabled: {
    borderColor: theme.colors.neutral[300],
    backgroundColor: theme.colors.neutral[100],
  },
  error: {
    borderColor: theme.colors.error[500],
  },
});
