import { useMemo, useState } from 'react';
import { submitFeedback, type FeedbackCategory } from '../feedback-service';
import { getTranslations, type Locale } from '../../localization/localization';

type FeedbackCategoryOption = {
  key: FeedbackCategory;
  label: string;
};

export function useFeedbackScreenState(locale: Locale) {
  const t = getTranslations(locale);
  const [category, setCategory] = useState<FeedbackCategory>('notification-problem');
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const categories = useMemo<FeedbackCategoryOption[]>(
    () => [
      { key: 'notification-problem', label: t.feedbackCategoryNotificationProblem },
      { key: 'add-medication-problem', label: t.feedbackCategoryAddMedicationProblem },
      { key: 'suggestion', label: t.feedbackCategorySuggestion },
      { key: 'other', label: t.feedbackCategoryOther },
    ],
    [t.feedbackCategoryAddMedicationProblem, t.feedbackCategoryNotificationProblem, t.feedbackCategoryOther, t.feedbackCategorySuggestion],
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
      setStatusText(t.feedbackReceived);
    } catch {
      setStatusText(t.feedbackSendFailed);
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
