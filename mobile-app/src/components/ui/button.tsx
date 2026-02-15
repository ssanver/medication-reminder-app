import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { theme } from '../../theme';

type ButtonVariant = 'filled' | 'filled-dark' | 'outlined' | 'ghost' | 'success' | 'danger';
type ButtonSize = 'xs' | 's' | 'm' | 'l';

type ButtonProps = {
  label: string;
  leadingIcon?: string;
  leadingNode?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  onPress: () => void;
};

export function Button({
  label,
  leadingIcon,
  leadingNode,
  disabled = false,
  variant = 'filled',
  size = 'm',
  fullWidth = true,
  onPress,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.contentRow}>
        {leadingNode ? <View style={styles.leadingNode}>{leadingNode}</View> : null}
        <Text style={[textSizeStyles[size], textVariantStyles[variant], disabled && styles.disabledText]}>
          {leadingIcon ? `${leadingIcon}  ` : ''}
          {label}
        </Text>
      </View>
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
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.42,
  },
  disabledText: {
    color: theme.colors.neutral[500],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[8],
  },
  leadingNode: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  xs: {
    minHeight: 32,
    paddingHorizontal: theme.spacing[16],
  },
  s: {
    minHeight: 36,
    paddingHorizontal: theme.spacing[16],
  },
  m: {
    minHeight: 44,
    paddingHorizontal: theme.spacing[24],
  },
  l: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[24],
  },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  filled: {
    backgroundColor: theme.colors.primaryBlue[500],
    borderColor: theme.colors.primaryBlue[500],
  },
  'filled-dark': {
    backgroundColor: theme.colors.primaryBlue[800],
    borderColor: theme.colors.primaryBlue[800],
  },
  outlined: {
    backgroundColor: theme.colors.semantic.backgroundDefault,
    borderColor: theme.colors.primaryBlue[600],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: theme.colors.success[500],
    borderColor: theme.colors.success[500],
  },
  danger: {
    backgroundColor: theme.colors.error[500],
    borderColor: theme.colors.error[500],
  },
};

const textSizeStyles = StyleSheet.create({
  xs: {
    ...theme.typography.button.xsMedium,
  },
  s: {
    ...theme.typography.button.sMedium,
  },
  m: {
    ...theme.typography.button.mMedium,
  },
  l: {
    ...theme.typography.button.lMedium,
  },
});

const textVariantStyles = StyleSheet.create({
  filled: {
    color: '#FFFFFF',
  },
  'filled-dark': {
    color: '#FFFFFF',
  },
  outlined: {
    color: theme.colors.primaryBlue[600],
  },
  ghost: {
    color: theme.colors.semantic.textPrimary,
  },
  success: {
    color: '#FFFFFF',
  },
  danger: {
    color: '#FFFFFF',
  },
});
