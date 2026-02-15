import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { theme } from '../../theme';

type IconButtonVariant = 'filled' | 'outlined' | 'ghost';
type IconButtonSize = 's' | 'm' | 'l';

type IconButtonProps = {
  icon: string;
  disabled?: boolean;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  onPress: () => void;
};

export function IconButton({
  icon,
  disabled = false,
  variant = 'ghost',
  size = 'm',
  onPress,
}: IconButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.base, sizeStyles[size], variantStyles[variant], disabled && styles.disabled]}>
      <Text style={[iconStyles[size], iconVariantStyles[variant]]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.35,
  },
});

const sizeStyles: Record<IconButtonSize, ViewStyle> = {
  s: { width: 28, height: 28 },
  m: { width: 36, height: 36 },
  l: { width: 44, height: 44 },
};

const variantStyles: Record<IconButtonVariant, ViewStyle> = {
  filled: {
    backgroundColor: theme.colors.primaryBlue[500],
    borderColor: theme.colors.primaryBlue[500],
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.primaryBlue[600],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
};

const iconStyles = StyleSheet.create({
  s: {
    ...theme.typography.bodyScale.xmMedium,
  },
  m: {
    ...theme.typography.bodyScale.mRegular,
  },
  l: {
    ...theme.typography.bodyScale.lRegular,
  },
});

const iconVariantStyles = StyleSheet.create({
  filled: { color: '#FFFFFF' },
  outlined: { color: theme.colors.primaryBlue[600] },
  ghost: { color: theme.colors.semantic.textPrimary },
});
