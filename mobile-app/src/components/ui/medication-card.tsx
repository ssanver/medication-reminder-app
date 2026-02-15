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
  actionVariant?: 'filled' | 'success' | 'danger';
  statusBadge?: 'ontime' | 'missed';
  medEmoji?: string;
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
  statusBadge,
  medEmoji = '💊',
  onToggle,
  onActionPress,
}: MedicationCardProps) {
  return (
    <View style={[styles.card, !active && styles.cardDisabled]}>
      {statusBadge ? (
        <View style={[styles.badge, statusBadge === 'missed' ? styles.badgeMissed : styles.badgeOnTime]}>
          <Text style={styles.badgeText}>{statusBadge === 'missed' ? 'Missed' : '2h 23m'}</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>{medEmoji}</Text>
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
          <Button
            label={actionLabel}
            size="xs"
            variant={actionVariant === 'success' ? 'success' : actionVariant === 'danger' ? 'danger' : 'filled'}
            onPress={onActionPress ?? (() => undefined)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    padding: theme.spacing[8],
    gap: theme.spacing[8],
    position: 'relative',
    ...theme.elevation.card,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: theme.radius[8],
    paddingHorizontal: theme.spacing[8],
    paddingVertical: 3,
    zIndex: 2,
  },
  badgeOnTime: {
    backgroundColor: theme.colors.primaryBlue[500],
  },
  badgeMissed: {
    backgroundColor: theme.colors.error[500],
  },
  badgeText: {
    ...theme.typography.captionScale.mRegular,
    color: '#FFFFFF',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: 2,
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
    color: theme.colors.semantic.textMuted,
  },
  actionWrap: {
    alignItems: 'flex-end',
  },
});
