import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { useFeedbackScreenState } from '../features/feedback/application/use-feedback-screen-state';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type FeedbackScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function FeedbackScreen({ locale, onBack }: FeedbackScreenProps) {
  const t = getTranslations(locale);
  const {
    category,
    setCategory,
    message,
    setMessage,
    statusText,
    categoryPickerOpen,
    setCategoryPickerOpen,
    categories,
    canSubmit,
    selectedCategoryLabel,
    send,
  } = useFeedbackScreenState(locale);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.contactUs} leftAction={{ icon: 'back', onPress: onBack }} />

      <View style={styles.card}>
        <Text style={styles.label}>{t.feedbackSubject}</Text>
        <Pressable style={styles.combo} onPress={() => setCategoryPickerOpen(true)}>
          <Text style={styles.comboText}>{selectedCategoryLabel}</Text>
          <Text style={styles.chevron}>{'>'}</Text>
        </Pressable>

        <Text style={styles.label}>{t.feedbackMessage}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder={t.feedbackMessagePlaceholder}
          placeholderTextColor={theme.colors.semantic.textMuted}
          style={styles.textArea}
        />

        {statusText.length > 0 ? <Text style={styles.status}>{statusText}</Text> : null}
        <Button label={t.feedbackSubmit} onPress={() => void send()} disabled={!canSubmit} />
      </View>

      <Modal transparent visible={categoryPickerOpen} animationType="slide" onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCategoryPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{t.feedbackSelectSubject}</Text>
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
