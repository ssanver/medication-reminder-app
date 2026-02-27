import { Pressable, StyleSheet, Text, type Insets, type ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { AppIcon, type AppIconName } from './app-icon';

type IconButtonVariant = 'filled' | 'outlined' | 'ghost';
type IconButtonSize = 's' | 'm' | 'l';

type IconButtonProps = {
  icon: AppIconName | string;
  testID?: string;
  disabled?: boolean;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  onPress: () => void;
};

const appIconNames: AppIconName[] = ['home', 'pill', 'add', 'settings', 'back', 'forward', 'close', 'check', 'alarm'];
const iconNameSet = new Set<AppIconName>(appIconNames);
const pressHitSlop: Insets = { top: 8, right: 8, bottom: 8, left: 8 };

export function IconButton({
  icon,
  testID,
  disabled = false,
  variant = 'ghost',
  size = 'm',
  onPress,
}: IconButtonProps) {
  const isAppIcon = iconNameSet.has(icon as AppIconName);
  const iconColor = iconColorMap[variant];

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      disabled={disabled}
      hitSlop={pressHitSlop}
      style={({ pressed }) => [styles.base, sizeStyles[size], variantStyles[variant], pressed && styles.pressed, disabled && styles.disabled]}
    >
      {isAppIcon ? <AppIcon name={icon as AppIconName} size={iconSizeMap[size]} color={iconColor} /> : <Text style={[iconStyles[size], iconVariantStyles[variant]]}>{icon}</Text>}
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
  pressed: {
    transform: [{ scale: 0.96 }],
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
    backgroundColor: theme.colors.semantic.cardBackground,
    borderColor: theme.colors.semantic.borderSoft,
  },
  ghost: {
    backgroundColor: theme.colors.neutral[100],
    borderColor: theme.colors.neutral[200],
  },
};

const iconSizeMap: Record<IconButtonSize, number> = {
  s: 14,
  m: 18,
  l: 20,
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

const iconColorMap: Record<IconButtonVariant, string> = {
  filled: '#FFFFFF',
  outlined: theme.colors.primaryBlue[600],
  ghost: theme.colors.semantic.textPrimary,
};
