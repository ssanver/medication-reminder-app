import { useMemo, useState } from 'react';
import { submitFeedback, type FeedbackCategory } from '../feedback-service';
import { type Locale } from '../../localization/localization';

type FeedbackCategoryOption = {
  key: FeedbackCategory;
  label: string;
};

export function useFeedbackScreenState(locale: Locale) {
  const [category, setCategory] = useState<FeedbackCategory>('notification-problem');
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const categories = useMemo<FeedbackCategoryOption[]>(
    () => [
      { key: 'notification-problem', label: locale === 'tr' ? 'Bildirim Sorunu' : 'Notification Problem' },
      { key: 'add-medication-problem', label: locale === 'tr' ? 'İlaç Ekleme Sorunu' : 'Add Medication Problem' },
      { key: 'suggestion', label: locale === 'tr' ? 'Öneri' : 'Suggestion' },
      { key: 'other', label: locale === 'tr' ? 'Diğer' : 'Other' },
    ],
    [locale],
  );

  const canSubmit = message.trim().length >= 10 && !submitting;
  const selectedCategoryLabel = categories.find((item) => item.key === category)?.label ?? '';

  async function send() {
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

  return {
    category,
    setCategory,
    message,
    setMessage,
    statusText,
    submitting,
    categoryPickerOpen,
    setCategoryPickerOpen,
    categories,
    canSubmit,
    selectedCategoryLabel,
    send,
  };
}
