import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
        <View style={styles.categoryWrap}>
          {categories.map((item) => {
            const selected = item.key === category;
            return (
              <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.categoryChip, selected && styles.categoryChipActive]}>
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

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
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  categoryChip: {
    minHeight: 32,
    paddingHorizontal: theme.spacing[8],
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  categoryText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  categoryTextActive: {
    color: theme.colors.primaryBlue[600],
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
});
