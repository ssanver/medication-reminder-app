import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Locale } from '../../features/localization/localization';
import type { ReminderPrompt } from '../../features/notifications/local-notifications';
import { theme } from '../../theme';

type ReminderPromptModalProps = {
  visible: boolean;
  locale: Locale;
  reminder: ReminderPrompt | null;
  onTakeNow: () => void;
  onSkip: () => void;
};

export function ReminderPromptModal({ visible, locale, reminder, onTakeNow, onSkip }: ReminderPromptModalProps) {
  if (!visible || !reminder) {
    return null;
  }

  const takeLabel = locale === 'tr' ? 'Şimdi Al' : 'Take Now';
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

          <Pressable style={styles.secondaryButton} onPress={onSkip}>
            <Text style={styles.secondaryLabel}>{skipLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[24],
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: theme.radius[24],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    color: '#F5F7FA',
  },
  title: {
    ...theme.typography.heading.h6Medium,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyScale.mRegular,
    color: '#F5F7FA',
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
    backgroundColor: '#FFFFFF',
  },
  secondaryLabel: {
    ...theme.typography.bodyScale.mMedium,
    color: '#8A8E98',
  },
});
