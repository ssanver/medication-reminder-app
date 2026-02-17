import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Locale } from '../../features/localization/localization';
import type { ReminderPrompt } from '../../features/notifications/local-notifications';
import { theme } from '../../theme';

type ReminderPromptModalProps = {
  visible: boolean;
  locale: Locale;
  snoozeMinutes: number;
  reminder: ReminderPrompt | null;
  onTakeNow: () => void;
  onSnooze: () => void;
  onSkip: () => void;
};

export function ReminderPromptModal({ visible, locale, snoozeMinutes, reminder, onTakeNow, onSnooze, onSkip }: ReminderPromptModalProps) {
  if (!visible || !reminder) {
    return null;
  }

  const takeLabel = locale === 'tr' ? 'Şimdi Al' : 'Take Now';
  const snoozeLabel = locale === 'tr' ? `${snoozeMinutes} dk Ertele` : `Snooze ${snoozeMinutes} min`;
  const skipLabel = locale === 'tr' ? 'Atla' : 'Skip';
  const header = locale === 'tr' ? `${reminder.scheduledTime} İlaçları` : `${reminder.scheduledTime} Medicines`;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🧴</Text>
          <Text style={styles.header}>{header}</Text>
          <Text style={styles.title}>{reminder.medicationName}</Text>
          <Text style={styles.subtitle}>{reminder.medicationDetails}</Text>

          <Pressable style={styles.primaryButton} onPress={onTakeNow}>
            <Text style={styles.primaryLabel}>{takeLabel}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onSnooze}>
            <Text style={styles.secondaryLabel}>{snoozeLabel}</Text>
          </Pressable>

          <Pressable style={styles.tertiaryButton} onPress={onSkip}>
            <Text style={styles.tertiaryLabel}>{skipLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[24],
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: theme.radius[24],
    borderWidth: 1,
    borderColor: '#D8DBE3',
    backgroundColor: '#F1F2F6',
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[16],
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  emoji: {
    fontSize: 78,
    lineHeight: 84,
  },
  header: {
    ...theme.typography.bodyScale.xmRegular,
    color: '#4A4F5C',
  },
  title: {
    ...theme.typography.heading.h6Medium,
    color: '#12141A',
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyScale.mRegular,
    color: '#555B69',
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: theme.radius[16],
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryBlue[500],
    marginTop: theme.spacing[8],
  },
  primaryLabel: {
    ...theme.typography.bodyScale.mMedium,
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: theme.radius[16],
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E8F0',
  },
  secondaryLabel: {
    ...theme.typography.bodyScale.mMedium,
    color: '#2C3448',
  },
  tertiaryButton: {
    minHeight: 48,
    borderRadius: theme.radius[16],
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tertiaryLabel: {
    ...theme.typography.bodyScale.mMedium,
    color: '#8A8E98',
  },
});
