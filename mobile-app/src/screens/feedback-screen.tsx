import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { submitFeedback, type FeedbackCategory } from '../features/feedback/feedback-service';
import { type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type FeedbackScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function FeedbackScreen({ locale, onBack }: FeedbackScreenProps) {
  const [category, setCategory] = useState<FeedbackCategory>('notification-problem');
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const categories = useMemo(
    () => [
      { key: 'notification-problem' as const, label: locale === 'tr' ? 'Bildirim Sorunu' : 'Notification Problem' },
      { key: 'add-medication-problem' as const, label: locale === 'tr' ? 'İlaç Ekleme Sorunu' : 'Add Medication Problem' },
      { key: 'suggestion' as const, label: locale === 'tr' ? 'Öneri' : 'Suggestion' },
      { key: 'other' as const, label: locale === 'tr' ? 'Diğer' : 'Other' },
    ],
    [locale],
  );

  const canSubmit = message.trim().length >= 10 && !submitting;
  const selectedCategoryLabel = categories.find((item) => item.key === category)?.label ?? '';

  async function onSubmit() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setStatusText('');
    try {
      await submitFeedback(category, message.trim());
      setMessage('');
      setStatusText(locale === 'tr' ? 'Geri bildiriminiz alınmıştır.' : 'Feedback received.');
    } catch {
      setStatusText(locale === 'tr' ? 'Gönderim başarısız. Lütfen tekrar deneyin.' : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={locale === 'tr' ? 'Bize Yazın' : 'Contact Us'} leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.card}>
        <Text style={styles.label}>{locale === 'tr' ? 'Konu' : 'Subject'}</Text>
        <Pressable style={styles.combo} onPress={() => setCategoryPickerOpen(true)}>
          <Text style={styles.comboText}>{selectedCategoryLabel}</Text>
          <Text style={styles.chevron}>{'>'}</Text>
        </Pressable>

        <Text style={styles.label}>{locale === 'tr' ? 'Mesaj' : 'Message'}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder={locale === 'tr' ? 'Mesajınızı yazın (min 10 karakter)' : 'Write your message (min 10 chars)'}
          placeholderTextColor={theme.colors.semantic.textMuted}
          style={styles.textArea}
        />

        {statusText.length > 0 ? <Text style={styles.status}>{statusText}</Text> : null}
        <Button label={locale === 'tr' ? 'Gönder' : 'Submit'} onPress={() => void onSubmit()} disabled={!canSubmit} />
      </View>

      <Modal transparent visible={categoryPickerOpen} animationType="slide" onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCategoryPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{locale === 'tr' ? 'Konu seçin' : 'Select subject'}</Text>
            {categories.map((item) => {
              const selected = item.key === category;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.optionRow, selected && styles.optionRowActive]}
                  onPress={() => {
                    setCategory(item.key);
                    setCategoryPickerOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[16],
  },
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  label: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  combo: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comboText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  chevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  textArea: {
    minHeight: 140,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  status: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[600],
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.semantic.overlay,
  },
  sheet: {
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    backgroundColor: theme.colors.semantic.cardBackground,
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[16],
    gap: theme.spacing[8],
  },
  sheetTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  optionRow: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  optionRowActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  optionText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
});
