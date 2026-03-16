import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppFontScale } from '../../features/accessibility/app-font-scale';
import { theme } from '../../theme';

type ButtonVariant = 'filled' | 'filled-dark' | 'outlined' | 'ghost' | 'success' | 'danger';
type ButtonSize = 'xs' | 's' | 'm' | 'l';

type ButtonProps = {
  label: string;
  testID?: string;
  leadingIcon?: string;
  leadingNode?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  onPress: () => void;
};

export function Button({
  label,
  testID,
  leadingIcon,
  leadingNode,
  loading = false,
  disabled = false,
  variant = 'filled',
  size = 'm',
  fullWidth = true,
  onPress,
}: ButtonProps) {
  const fontScale = useAppFontScale();
  const textBaseBySize = {
    xs: theme.typography.button.xsMedium,
    s: theme.typography.button.sMedium,
    m: theme.typography.button.mMedium,
    l: theme.typography.button.lMedium,
  } as const;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        loading && styles.loading,
      ]}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outlined' || variant === 'ghost' ? theme.colors.primaryBlue[600] : '#FFFFFF'}
          />
        ) : leadingNode ? (
          <View style={styles.leadingNode}>{leadingNode}</View>
        ) : null}
        <Text
          style={[
            textSizeStyles[size],
            {
              fontSize: textBaseBySize[size].fontSize * fontScale,
            },
            textVariantStyles[variant],
            (disabled || loading) && styles.disabledText,
          ]}
        >
          {!loading && leadingIcon ? `${leadingIcon}  ` : ''}
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
  loading: {
    opacity: 0.88,
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
