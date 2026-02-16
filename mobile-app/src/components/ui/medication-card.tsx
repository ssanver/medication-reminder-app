import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppFontScale } from '../../features/accessibility/app-font-scale';
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
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  statusBadge?: 'ontime' | 'missed';
  medEmoji?: string;
  compact?: boolean;
  onToggle?: (value: boolean) => void;
  onActionPress?: () => void;
  onPress?: () => void;
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
  secondaryActionLabel,
  onSecondaryActionPress,
  statusBadge,
  medEmoji = '💊',
  compact = false,
  onToggle,
  onActionPress,
  onPress,
}: MedicationCardProps) {
  const fontScale = useAppFontScale();
  return (
    <Pressable style={[styles.card, compact && styles.cardCompact, !active && styles.cardDisabled]} onPress={onPress}>
      {statusBadge ? (
        <View style={[styles.badge, statusBadge === 'missed' ? styles.badgeMissed : styles.badgeOnTime]}>
          <Text style={[styles.badgeText, { fontSize: theme.typography.captionScale.mRegular.fontSize * fontScale }]}>
            {statusBadge === 'missed' ? 'Missed' : '2h 23m'}
          </Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <View style={[styles.avatar, compact && styles.avatarCompact]}>
          <Text style={[styles.avatarIcon, compact && styles.avatarIconCompact]}>{medEmoji}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { fontSize: theme.typography.bodyScale.mBold.fontSize * fontScale }, compact && styles.titleCompact]}>{name}</Text>
          <Text style={[styles.meta, { fontSize: theme.typography.captionScale.lRegular.fontSize * fontScale }, compact && styles.metaCompact]}>{details}</Text>
          <Text style={[styles.meta, { fontSize: theme.typography.captionScale.lRegular.fontSize * fontScale }, compact && styles.metaCompact]}>{schedule}</Text>
          {remaining ? <Text style={[styles.metaMuted, { fontSize: theme.typography.captionScale.lRegular.fontSize * fontScale }]}>{remaining}</Text> : null}
        </View>

        {showToggle ? (
          <Pressable
            style={[styles.toggleTrack, active && styles.toggleTrackActive]}
            onPress={() => onToggle?.(!active)}
            hitSlop={8}
          >
            <View style={[styles.toggleThumb, active && styles.toggleThumbActive]} />
          </Pressable>
        ) : null}
      </View>

      {showAction ? (
        <View style={styles.actionWrap}>
          {secondaryActionLabel ? (
            <Pressable onPress={onSecondaryActionPress} style={styles.secondaryAction}>
              <Text style={[styles.secondaryActionText, { fontSize: theme.typography.captionScale.lRegular.fontSize * fontScale }]}>
                {secondaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
          <Button
            label={actionLabel}
            size="xs"
            variant={actionVariant === 'success' ? 'success' : actionVariant === 'danger' ? 'danger' : 'filled'}
            onPress={onActionPress ?? (() => undefined)}
          />
        </View>
      ) : null}
    </Pressable>
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
  cardCompact: {
    borderRadius: theme.radius[16],
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[16],
  },
  cardDisabled: {
    opacity: 0.58,
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
  avatarCompact: {
    width: 56,
    height: 56,
    borderRadius: theme.radius[16],
  },
  avatarIcon: {
    fontSize: 24,
  },
  avatarIconCompact: {
    fontSize: 30,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  titleCompact: {
    ...theme.typography.bodyScale.mBold,
  },
  meta: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  metaCompact: {
    ...theme.typography.bodyScale.xmMedium,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.neutral[200],
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: theme.colors.primaryBlue[500],
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  metaMuted: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textMuted,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing[8],
  },
  secondaryAction: {
    minHeight: 26,
    paddingHorizontal: theme.spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
  },
  actionWrapLegacy: {
    alignItems: 'flex-end',
  },
});
