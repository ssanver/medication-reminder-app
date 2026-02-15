import { StyleSheet, Switch, Text, View } from 'react-native';
import { theme } from '../../theme';
import { Button } from './button';

type MedicationCardProps = {
  name: string;
  details: string;
  schedule: string;
  remaining?: string;
  active?: boolean;
  showToggle?: boolean;
  showAction?: boolean;
  actionLabel?: string;
  actionVariant?: 'filled' | 'success';
  onToggle?: (value: boolean) => void;
  onActionPress?: () => void;
};

export function MedicationCard({
  name,
  details,
  schedule,
  remaining,
  active = true,
  showToggle,
  showAction,
  actionLabel = 'Take',
  actionVariant = 'filled',
  onToggle,
  onActionPress,
}: MedicationCardProps) {
  return (
    <View style={[styles.card, !active && styles.cardDisabled]}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>💊</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.meta}>{details}</Text>
          <Text style={styles.meta}>{schedule}</Text>
          {remaining ? <Text style={styles.metaMuted}>{remaining}</Text> : null}
        </View>

        {showToggle ? <Switch value={active} onValueChange={onToggle} /> : null}
      </View>

      {showAction ? (
        <View style={styles.actionWrap}>
          <Button label={actionLabel} size="s" variant={actionVariant === 'success' ? 'success' : 'filled'} onPress={onActionPress ?? (() => undefined)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius[16],
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    padding: theme.spacing[8],
    gap: theme.spacing[8],
  },
  cardDisabled: {
    opacity: 0.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 26,
  },
  content: {
    flex: 1,
    gap: theme.spacing[4],
  },
  title: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  meta: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  metaMuted: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  actionWrap: {
    alignItems: 'flex-end',
  },
});
