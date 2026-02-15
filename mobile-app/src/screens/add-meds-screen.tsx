import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheetHandle } from '../components/ui/bottom-sheet-handle';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { localizeFormLabel, localizeFrequencyLabel } from '../features/localization/medication-localization';
import { addMedication } from '../features/medications/medication-store';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  onMedicationSaved: () => void;
};

type PickerSheet = 'none' | 'form' | 'frequency' | 'dosage' | 'date' | 'time';

type FormOption = {
  key: string;
  emoji: string;
};

const formOptions: FormOption[] = [
  { key: 'Capsule', emoji: '💊' },
  { key: 'Pill', emoji: '💊' },
  { key: 'Drop', emoji: '🫙' },
  { key: 'Syrup', emoji: '🧴' },
  { key: 'Injection', emoji: '💉' },
  { key: 'Other', emoji: '• • •' },
];

const frequencyOptions = ['Every 1 Day', 'Every 3 Days', 'Every 1 Hour'];
const dosageOptions = ['0.5', '1', '2', '3'];

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const minutes = index * 15;
  const hour = `${Math.floor(minutes / 60)}`.padStart(2, '0');
  const minute = `${minutes % 60}`.padStart(2, '0');
  return `${hour}:${minute}`;
});

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getUpcomingDates(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(start);
    d.setDate(start.getDate() + offset);
    return d;
  });
}

function getSelectedFormEmoji(form: string): string {
  return formOptions.find((option) => option.key === form)?.emoji ?? '💊';
}

export function AddMedsScreen({ locale, onMedicationSaved }: AddMedsScreenProps) {
  const t = getTranslations(locale);
  const [sheet, setSheet] = useState<PickerSheet>('none');
  const [name, setName] = useState('');
  const [form, setForm] = useState('Capsule');
  const [frequency, setFrequency] = useState('Every 1 Day');
  const [dosage, setDosage] = useState('1');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [time, setTime] = useState('09:00');
  const [isActive, setIsActive] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  const canSave = useMemo(() => name.trim().length > 1, [name]);

  const localizedStartDate = useMemo(() => {
    const parsed = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return startDate;
    }

    return parsed.toLocaleDateString(getLocaleTag(locale), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [locale, startDate]);

  const upcomingDates = useMemo(() => getUpcomingDates(new Date(), 30), []);

  async function saveMedication() {
    if (!canSave) {
      return;
    }

    await addMedication({
      name,
      form,
      frequencyLabel: frequency,
      dosage,
      note,
      startDate,
      time,
      active: isActive,
    });

    setSavedMessage(t.medicationCreated);
    setName('');
    setForm('Capsule');
    setFrequency('Every 1 Day');
    setDosage('1');
    setNote('');
    setStartDate(formatDate(new Date()));
    setTime('09:00');
    setIsActive(true);
    setSheet('none');
    setTimeout(() => onMedicationSaved(), 400);
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.medicationDetails}</Text>

        <View style={styles.medicationCard}>
          <View style={styles.medicationIconWrap}>
            <Text style={styles.medicationIcon}>{getSelectedFormEmoji(form)}</Text>
          </View>
          <View style={styles.medicationTextWrap}>
            <Text style={styles.medicationTitle}>{name.trim() || t.medicationName}</Text>
            <Text style={styles.medicationSubtitle}>{`${dosage} ${localizeFormLabel(form, locale)} | ${localizeFrequencyLabel(frequency, locale)}`}</Text>
          </View>
          <Pressable style={[styles.toggleTrack, isActive && styles.toggleTrackActive]} onPress={() => setIsActive((prev) => !prev)}>
            <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
          </Pressable>
        </View>

        <TextField
          label={t.medicationName}
          value={name}
          placeholder={t.medicationNamePlaceholder}
          helperText={t.required}
          onChangeText={setName}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.schedule}</Text>
          <View style={styles.rowTwoCol}>
            <SelectorField
              label={t.startDate}
              value={localizedStartDate}
              icon="📅"
              onPress={() => setSheet('date')}
            />
            <SelectorField
              label={t.time}
              value={time}
              icon="⏰"
              onPress={() => setSheet('time')}
            />
          </View>
          <SelectorField
            label={t.frequency}
            value={localizeFrequencyLabel(frequency, locale)}
            icon="↻"
            onPress={() => setSheet('frequency')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dose}</Text>
          <View style={styles.rowTwoCol}>
            <SelectorField label={t.dosage} value={dosage} icon="💧" onPress={() => setSheet('dosage')} />
            <SelectorField
              label={t.form}
              value={localizeFormLabel(form, locale)}
              icon={getSelectedFormEmoji(form)}
              onPress={() => setSheet('form')}
            />
          </View>
          <TextField
            label={t.note}
            value={note}
            placeholder={t.notePlaceholder}
            helperText={t.optional}
            onChangeText={setNote}
          />
        </View>

        {savedMessage ? <Text style={styles.success}>{savedMessage}</Text> : null}

        <Button label={t.save} onPress={saveMedication} disabled={!canSave} />
      </ScrollView>

      <Modal transparent visible={sheet !== 'none'} animationType="slide" onRequestClose={() => setSheet('none')}>
        <Pressable style={styles.overlay} onPress={() => setSheet('none')}>
          <Pressable style={styles.sheetContainer} onPress={() => undefined}>
            <BottomSheetHandle />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{getSheetTitle(sheet, locale)}</Text>
              <Pressable onPress={() => setSheet('none')} hitSlop={8}>
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>

            {sheet === 'form'
              ? formOptions.map((option) => {
                  const selected = option.key === form;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                      onPress={() => {
                        setForm(option.key);
                        setSheet('none');
                      }}
                    >
                      <Text style={styles.sheetOptionIcon}>{option.emoji}</Text>
                      <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>{localizeFormLabel(option.key, locale)}</Text>
                    </Pressable>
                  );
                })
              : null}

            {sheet === 'frequency'
              ? frequencyOptions.map((option) => {
                  const selected = option === frequency;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                      onPress={() => {
                        setFrequency(option);
                        setSheet('none');
                      }}
                    >
                      <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>{localizeFrequencyLabel(option, locale)}</Text>
                    </Pressable>
                  );
                })
              : null}

            {sheet === 'dosage'
              ? dosageOptions.map((option) => {
                  const selected = option === dosage;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                      onPress={() => {
                        setDosage(option);
                        setSheet('none');
                      }}
                    >
                      <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>{option}</Text>
                    </Pressable>
                  );
                })
              : null}

            {sheet === 'date'
              ? upcomingDates.map((date) => {
                  const key = formatDate(date);
                  const selected = key === startDate;
                  const label = date.toLocaleDateString(getLocaleTag(locale), {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <Pressable
                      key={key}
                      style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                      onPress={() => {
                        setStartDate(key);
                        setSheet('none');
                      }}
                    >
                      <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })
              : null}

            {sheet === 'time'
              ? timeOptions.map((option) => {
                  const selected = option === time;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                      onPress={() => {
                        setTime(option);
                        setSheet('none');
                      }}
                    >
                      <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>{option}</Text>
                    </Pressable>
                  );
                })
              : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

type SelectorFieldProps = {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
};

function SelectorField({ label, value, icon, onPress }: SelectorFieldProps) {
  return (
    <View style={styles.selectorWrap}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Pressable style={styles.selectorBox} onPress={onPress}>
        <Text style={styles.selectorValue} numberOfLines={1}>
          {`${icon} ${value}`}
        </Text>
        <Text style={styles.selectorChevron}>›</Text>
      </Pressable>
    </View>
  );
}

function getSheetTitle(sheet: PickerSheet, locale: Locale): string {
  if (sheet === 'date') {
    return getTranslations(locale).selectDate;
  }

  if (sheet === 'time') {
    return getTranslations(locale).setTime;
  }

  if (sheet === 'frequency') {
    return getTranslations(locale).setFrequency;
  }

  if (sheet === 'dosage') {
    return locale === 'tr' ? 'Doz secin' : 'Select dosage';
  }

  if (sheet === 'form') {
    return locale === 'tr' ? 'Form secin' : 'Select form';
  }

  return '';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[24],
  },
  title: {
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  medicationCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  medicationIconWrap: {
    width: 54,
    height: 54,
    borderRadius: theme.radius[8],
    backgroundColor: theme.colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationIcon: {
    fontSize: 24,
  },
  medicationTextWrap: {
    flex: 1,
    gap: 2,
  },
  medicationTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  medicationSubtitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 16,
    padding: 2,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: theme.colors.primaryBlue[500],
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  section: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[8],
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  sectionTitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  rowTwoCol: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  selectorWrap: {
    flex: 1,
    gap: theme.spacing[4],
  },
  selectorLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  selectorBox: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  selectorValue: {
    flex: 1,
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  selectorChevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  success: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.success[500],
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.semantic.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '70%',
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    paddingTop: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[16],
    backgroundColor: theme.colors.semantic.backgroundDefault,
    gap: theme.spacing[8],
  },
  sheetHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[4],
  },
  sheetTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  sheetClose: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  sheetOption: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  sheetOptionActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  sheetOptionText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  sheetOptionTextActive: {
    color: theme.colors.primaryBlue[500],
  },
  sheetOptionIcon: {
    fontSize: 16,
  },
});
