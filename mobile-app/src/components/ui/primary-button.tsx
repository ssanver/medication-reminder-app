import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../theme';

type PrimaryButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, disabled, onPress }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.disabled]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.semantic.brandPrimary,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...theme.typography.button.sMedium,
    color: '#FFFFFF',
  },
});
