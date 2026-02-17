import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from '../components/ui/app-icon';
import { BottomSheetHandle } from '../components/ui/bottom-sheet-handle';
import { Button } from '../components/ui/button';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { localizeFormLabel } from '../features/localization/medication-localization';
import {
  alignDateToWeekday,
  buildCalendarCells,
  dayIntervalOptions,
  defaultDoseTimes,
  dosageOptions,
  dosesPerDayOptions,
  formOptions,
  formatDate,
  getDayIntervalLabel,
  getWeekdayLabel,
  hourOptions,
  medicationIconOptions,
  fallbackMedicationSuggestions,
  minuteOptions,
  parseDateKey,
  resolveDayInterval,
  resolveFormDefaultIcon,
  shiftMonth,
  splitTime,
  steps,
  toFrequencyLabel,
  type IntervalUnit,
  type WizardStep,
  weekdayOptions,
  weekIntervalOptions,
} from '../features/medications/add-medication-use-case';
import { searchMedicineCatalog } from '../features/medications/medicine-catalog-service';
import { addMedication } from '../features/medications/medication-store';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  onMedicationSaved: () => void;
};

type SheetType = 'none' | 'date' | 'time' | 'interval';

export function AddMedsScreen({ locale, fontScale: _fontScale, onMedicationSaved }: AddMedsScreenProps) {
  const t = getTranslations(locale);
  const [step, setStep] = useState<WizardStep>('name');
  const [sheet, setSheet] = useState<SheetType>('none');

  const [name, setName] = useState('');
  const [form, setForm] = useState('');
  const [iconEmoji, setIconEmoji] = useState('💊');
  const [dosage, setDosage] = useState('0.5');
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('day');
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [dosesPerDay, setDosesPerDay] = useState<number>(1);
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [doseTimes, setDoseTimes] = useState<string[]>(defaultDoseTimes);
  const [note, setNote] = useState('');
  const [catalogSuggestions, setCatalogSuggestions] = useState<string[]>(fallbackMedicationSuggestions);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [draftDate, setDraftDate] = useState(startDate);
  const [draftHour, setDraftHour] = useState('09');
  const [draftMinute, setDraftMinute] = useState('00');
  const [editingTimeIndex, setEditingTimeIndex] = useState(0);

  const stepIndex = steps.indexOf(step);
  const progress = (stepIndex + 1) / steps.length;

  const filteredSuggestions = useMemo(() => {
    const query = name.trim().toLowerCase();
    if (!query) {
      return catalogSuggestions;
    }

    return catalogSuggestions.filter((item) => item.toLowerCase().includes(query));
  }, [catalogSuggestions, name]);

  const localizedDate = useMemo(() => {
    const parsed = parseDateKey(startDate);
    return parsed.toLocaleDateString(getLocaleTag(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [locale, startDate]);
  const addMedicationLabel = useMemo(() => t.addMedication.replace(/^\s*\+\s*/, ''), [t.addMedication]);
  const selectedDoseTimes = useMemo(
    () => Array.from({ length: dosesPerDay }, (_, index) => doseTimes[index] ?? defaultDoseTimes[index] ?? '09:00'),
    [doseTimes, dosesPerDay],
  );
  const dayInterval = useMemo(() => resolveDayInterval(intervalUnit, intervalCount), [intervalUnit, intervalCount]);
  const effectiveStartDate = useMemo(
    () => (intervalUnit === 'week' ? alignDateToWeekday(startDate, selectedWeekday) : startDate),
    [intervalUnit, startDate, selectedWeekday],
  );
  const localizedEffectiveStartDate = useMemo(() => {
    const parsed = parseDateKey(effectiveStartDate);
    return parsed.toLocaleDateString(getLocaleTag(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [effectiveStartDate, locale]);
  const hasDuplicateTimes = useMemo(
    () => new Set(selectedDoseTimes.map((item) => item.trim())).size !== selectedDoseTimes.length,
    [selectedDoseTimes],
  );

  useEffect(() => {
    if (intervalUnit !== 'week') {
      return;
    }

    const aligned = alignDateToWeekday(startDate, selectedWeekday);
    if (aligned !== startDate) {
      setStartDate(aligned);
    }
  }, [intervalUnit, selectedWeekday, startDate]);

  useEffect(() => {
    const query = name.trim();
    const timer = setTimeout(() => {
      if (query.length === 0) {
        setCatalogSuggestions(fallbackMedicationSuggestions);
        return;
      }

      void (async () => {
        try {
          const items = await searchMedicineCatalog(query);
          setCatalogSuggestions(items.length > 0 ? items : fallbackMedicationSuggestions);
        } catch {
          setCatalogSuggestions(fallbackMedicationSuggestions);
        }
      })();
    }, 250);

    return () => clearTimeout(timer);
  }, [name]);

  const canProceed =
    (step === 'name' && name.trim().length > 1) ||
    (step === 'form-dose' && form.length > 0) ||
    (step === 'frequency' && Boolean(startDate) && selectedDoseTimes.every((item) => item.trim().length > 0) && !hasDuplicateTimes) ||
    step === 'note';

  const headerTitle =
    step === 'name'
      ? t.medicationName
      : step === 'form-dose'
        ? `${t.selectForm} & ${t.dose}`
        : step === 'frequency'
          ? t.frequency
          : t.note;

  async function handleSave(shouldSkipNote = false) {
    const normalizedName = name.trim();
    if (!normalizedName || !form || selectedDoseTimes.length === 0) {
      return;
    }

    await addMedication({
      name: normalizedName,
      form,
      iconEmoji,
      dosage,
      frequencyLabel: toFrequencyLabel(dayInterval),
      note: shouldSkipNote ? '' : note.trim(),
      startDate: effectiveStartDate,
      time: selectedDoseTimes[0],
      times: selectedDoseTimes,
      active: true,
    });

    setName('');
    setForm('');
    setIconEmoji('💊');
    setDosage('0.5');
    setIntervalUnit('day');
    setIntervalCount(1);
    setSelectedWeekday(1);
    setDosesPerDay(1);
    setStartDate(formatDate(new Date()));
    setDoseTimes(defaultDoseTimes);
    setNote('');
    setStep('name');
    onMedicationSaved();
  }

  function onNext() {
    if (!canProceed) {
      return;
    }

    if (step === 'note') {
      void handleSave(false);
      return;
    }

    setStep(steps[stepIndex + 1]);
  }

  function onBack() {
    if (stepIndex === 0) {
      return;
    }
    setStep(steps[stepIndex - 1]);
  }

  function openDateSheet() {
    const initialDate = intervalUnit === 'week' ? alignDateToWeekday(startDate, selectedWeekday) : startDate;
    setDraftDate(initialDate);
    setCalendarMonth(parseDateKey(initialDate));
    setSheet('date');
  }

  function openIntervalSheet() {
    setSheet('interval');
  }

  function openTimeSheet(index: number) {
    setEditingTimeIndex(index);
    const initialTime = doseTimes[index] ?? defaultDoseTimes[index] ?? '09:00';
    const { hour, minute } = splitTime(initialTime);
    setDraftHour(hour);
    setDraftMinute(minute);
    setSheet('time');
  }

  function renderStepContent() {
    if (step === 'name') {
      return (
        <View style={styles.stepBody}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.medicationNamePlaceholder}
              placeholderTextColor={theme.colors.neutral[400]}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.suggestionList}>
            {name.trim().length > 0 ? (
              <Pressable onPress={() => setName(name.trim())} style={styles.suggestionRow}>
                <Text style={styles.addNewBullet}>＋</Text>
                <Text numberOfLines={1} style={styles.suggestionPrimaryText}>{`${addMedicationLabel} ${name.trim()}`}</Text>
              </Pressable>
            ) : null}

            {filteredSuggestions.map((item) => (
              <Pressable key={item} onPress={() => setName(item)} style={styles.suggestionRow}>
                <Text numberOfLines={1} style={styles.suggestionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (step === 'form-dose') {
      return (
        <View style={styles.stepBody}>
          <View style={styles.dosageRow}>
            {dosageOptions.map((item) => {
              const selected = item === dosage;
              return (
                <Pressable key={item} onPress={() => setDosage(item)} style={[styles.dosageChip, selected && styles.dosageChipSelected]}>
                  <Text style={[styles.dosageChipText, selected && styles.dosageChipTextSelected]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formGrid}>
            {formOptions.map((item) => {
              const selected = form === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    setForm(item.key);
                    setIconEmoji(resolveFormDefaultIcon(item.key));
                  }}
                  style={[styles.formCard, selected && styles.formCardSelected]}
                >
                  <Text style={styles.formIcon}>{item.emoji}</Text>
                  <Text numberOfLines={1} style={[styles.formLabel, selected && styles.formLabelSelected]}>
                    {localizeFormLabel(item.key, locale)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.doseCountRow}>
            <Text style={styles.selectionLabel}>{locale === 'tr' ? 'İlaç simgesi' : 'Medication icon'}</Text>
            <View style={styles.iconPickerRow}>
              {medicationIconOptions.map((option) => {
                const selected = iconEmoji === option;
                return (
                  <Pressable key={option} onPress={() => setIconEmoji(option)} style={[styles.iconChip, selected && styles.iconChipSelected]}>
                    <Text style={styles.iconChipText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    if (step === 'frequency') {
      return (
        <View style={styles.stepBody}>
          <Pressable style={styles.selectionRow} onPress={openIntervalSheet}>
            <View style={styles.selectionLeft}>
              <Text style={styles.selectionIcon}>📅</Text>
              <Text style={styles.selectionLabel}>{locale === 'tr' ? 'Interval türü' : 'Interval type'}</Text>
            </View>
            <View style={styles.selectionRight}>
              <Text style={styles.selectionValue}>{locale === 'tr' ? (intervalUnit === 'day' ? 'Gün' : 'Hafta') : intervalUnit}</Text>
              <Text style={styles.selectionChevron}>›</Text>
            </View>
          </Pressable>

          <View style={styles.doseCountRow}>
            <Text style={styles.selectionLabel}>{locale === 'tr' ? 'Kaç aralıkta bir' : 'Repeat every'}</Text>
            <View style={styles.doseCountChipRow}>
              {(intervalUnit === 'day' ? dayIntervalOptions : weekIntervalOptions).map((count) => {
                const selected = count === intervalCount;
                return (
                  <Pressable key={count} onPress={() => setIntervalCount(count)} style={[styles.doseCountChip, selected && styles.doseCountChipSelected]}>
                    <Text style={[styles.doseCountChipText, selected && styles.doseCountChipTextSelected]}>{count}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {intervalUnit === 'week' ? (
            <View style={styles.doseCountRow}>
              <Text style={styles.selectionLabel}>{locale === 'tr' ? 'Haftanın günü' : 'Day of week'}</Text>
              <View style={styles.weekdayChipRow}>
                {weekdayOptions.map((weekday) => {
                  const selected = weekday === selectedWeekday;
                  return (
                    <Pressable
                      key={weekday}
                      onPress={() => setSelectedWeekday(weekday)}
                      style={[styles.weekdayChip, selected && styles.weekdayChipSelected]}
                    >
                      <Text style={[styles.weekdayChipText, selected && styles.weekdayChipTextSelected]}>
                        {getWeekdayLabel(weekday, locale)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.selectionHint}>
                {locale === 'tr'
                  ? `Başlangıç tarihi seçilen güne hizalanır: ${localizedEffectiveStartDate}`
                  : `Start date will align to selected day: ${localizedEffectiveStartDate}`}
              </Text>
            </View>
          ) : null}

          <View style={styles.doseCountRow}>
            <Text style={styles.selectionLabel}>{locale === 'tr' ? 'O gün kaç kere' : 'How many times that day'}</Text>
            <View style={styles.doseCountChipRow}>
              {dosesPerDayOptions.map((count) => {
                const selected = count === dosesPerDay;
                return (
                  <Pressable key={count} onPress={() => setDosesPerDay(count)} style={[styles.doseCountChip, selected && styles.doseCountChipSelected]}>
                    <Text style={[styles.doseCountChipText, selected && styles.doseCountChipTextSelected]}>{count}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.frequencySummary}>{getDayIntervalLabel(dayInterval, locale)}</Text>

          <Pressable style={styles.selectionRow} onPress={openDateSheet}>
            <View style={styles.selectionLeft}>
              <Text style={styles.selectionIcon}>🗓</Text>
              <Text style={styles.selectionLabel}>{t.startDate}</Text>
            </View>
            <View style={styles.selectionRight}>
              <Text style={styles.selectionValue}>{localizedDate}</Text>
              <Text style={styles.selectionChevron}>›</Text>
            </View>
          </Pressable>

          {selectedDoseTimes.map((slotTime, index) => (
            <Pressable key={`${index}-${slotTime}`} style={styles.selectionRow} onPress={() => openTimeSheet(index)}>
              <View style={styles.selectionLeft}>
                <Text style={styles.selectionIcon}>⏰</Text>
                <Text style={styles.selectionLabel}>{locale === 'tr' ? `${index + 1}. doz saati` : `Dose ${index + 1} time`}</Text>
              </View>
              <View style={styles.selectionRight}>
                <Text style={styles.selectionValue}>{slotTime || '--:--'}</Text>
                <Text style={styles.selectionChevron}>›</Text>
              </View>
            </Pressable>
          ))}

          {hasDuplicateTimes ? (
            <Text style={styles.timeWarning}>
              {locale === 'tr' ? 'Aynı saat birden fazla kez seçilemez.' : 'You cannot select the same time more than once.'}
            </Text>
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <Text style={styles.noteLabel}>{t.note}</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t.notePlaceholder}
          placeholderTextColor={theme.colors.neutral[400]}
          style={styles.noteInput}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>
    );
  }

  const calendarCells = buildCalendarCells(calendarMonth);
  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.screen}>
      <View style={styles.topProgressTrack}>
        <View style={[styles.topProgressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.headerRow}>
        <Pressable onPress={onBack} disabled={stepIndex === 0} style={styles.headerIconButton}>
          {stepIndex > 0 ? <AppIcon name="back" size={16} color={theme.colors.semantic.textSecondary} /> : null}
        </Pressable>
        <Text style={[styles.headerTitle, { fontSize: theme.typography.heading.h8Semibold.fontSize * _fontScale }]}>{headerTitle}</Text>
        <View style={styles.headerIconButton}>
          {step === 'note' ? (
            <Pressable onPress={() => void handleSave(true)} hitSlop={8}>
              <Text style={styles.skipText}>{locale === 'tr' ? 'Atla' : 'Skip'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={step === 'note' ? t.done : t.next} onPress={onNext} disabled={!canProceed} size="m" />
      </View>

      <Modal transparent visible={sheet !== 'none'} animationType="slide" onRequestClose={() => setSheet('none')}>
        <Pressable style={styles.overlay} onPress={() => setSheet('none')}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <BottomSheetHandle />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {sheet === 'date'
                  ? t.selectDate
                  : sheet === 'time'
                    ? t.setTime
                    : locale === 'tr'
                      ? 'Interval türü seçin'
                      : 'Select interval type'}
              </Text>
              <Pressable onPress={() => setSheet('none')} hitSlop={8}>
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>

            {sheet === 'interval' ? (
              <View style={styles.intervalWrap}>
                <Pressable
                  style={[styles.intervalOption, intervalUnit === 'day' && styles.intervalOptionSelected]}
                  onPress={() => {
                    setIntervalUnit('day');
                    setIntervalCount(1);
                    setSheet('none');
                  }}
                >
                  <Text style={[styles.intervalOptionText, intervalUnit === 'day' && styles.intervalOptionTextSelected]}>
                    {locale === 'tr' ? 'Gün' : 'Day'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.intervalOption, intervalUnit === 'week' && styles.intervalOptionSelected]}
                  onPress={() => {
                    setIntervalUnit('week');
                    setIntervalCount(1);
                    setSheet('none');
                  }}
                >
                  <Text style={[styles.intervalOptionText, intervalUnit === 'week' && styles.intervalOptionTextSelected]}>
                    {locale === 'tr' ? 'Hafta' : 'Week'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {sheet === 'date' ? (
              <View style={styles.calendarWrap}>
                <View style={styles.calendarHeader}>
                  <Pressable onPress={() => setCalendarMonth((prev) => shiftMonth(prev, -1))} hitSlop={8}>
                    <Text style={styles.monthArrow}>‹</Text>
                  </Pressable>
                  <Text style={styles.monthTitle}>
                    {calendarMonth.toLocaleDateString(getLocaleTag(locale), { month: 'short', year: 'numeric' })}
                  </Text>
                  <Pressable onPress={() => setCalendarMonth((prev) => shiftMonth(prev, 1))} hitSlop={8}>
                    <Text style={styles.monthArrow}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.dayHeaderRow}>
                  {dayHeaders.map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.dayHeaderText}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarCells.map((dateCell, index) => {
                    if (!dateCell) {
                      return <View key={`empty-${index}`} style={styles.calendarCell} />;
                    }

                    const dateKey = formatDate(dateCell);
                    const selected = draftDate === dateKey;
                    const selectable = intervalUnit !== 'week' || dateCell.getDay() === selectedWeekday;

                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => {
                          if (!selectable) {
                            return;
                          }
                          setDraftDate(dateKey);
                        }}
                        disabled={!selectable}
                        style={[styles.calendarCell, selected && styles.calendarCellSelected, !selectable && styles.calendarCellDisabled]}
                      >
                        <Text
                          style={[
                            styles.calendarCellText,
                            selected && styles.calendarCellTextSelected,
                            !selectable && styles.calendarCellTextDisabled,
                          ]}
                        >
                          {dateCell.getDate()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Button
                  label={t.done}
                  onPress={() => {
                    setStartDate(draftDate);
                    setSheet('none');
                  }}
                />
              </View>
            ) : null}

            {sheet === 'time' ? (
              <View style={styles.timeWrap}>
                <Text style={styles.timeSectionLabel}>{locale === 'tr' ? 'Saat' : 'Hour'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeHorizontalList}>
                  {hourOptions.map((option) => {
                    const selected = draftHour === option;
                    return (
                      <Pressable key={`hour-${option}`} onPress={() => setDraftHour(option)} style={[styles.timeUnitChip, selected && styles.timeUnitChipSelected]}>
                        <Text style={[styles.timeUnitChipText, selected && styles.timeUnitChipTextSelected]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.timeSectionLabel}>{locale === 'tr' ? 'Dakika' : 'Minute'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeHorizontalList}>
                  {minuteOptions.map((option) => {
                    const selected = draftMinute === option;
                    return (
                      <Pressable key={`minute-${option}`} onPress={() => setDraftMinute(option)} style={[styles.timeUnitChip, selected && styles.timeUnitChipSelected]}>
                        <Text style={[styles.timeUnitChipText, selected && styles.timeUnitChipTextSelected]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Button
                  label={t.done}
                  onPress={() => {
                    const normalized = `${draftHour}:${draftMinute}`;
                    setDoseTimes((prev) => {
                      const next = [...prev];
                      next[editingTimeIndex] = normalized;
                      return next;
                    });
                    setSheet('none');
                  }}
                />
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  topProgressTrack: {
    height: 2,
    backgroundColor: theme.colors.neutral[200],
  },
  topProgressFill: {
    height: 2,
    backgroundColor: theme.colors.primaryBlue[500],
  },
  headerRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing[8],
  },
  headerIconButton: {
    width: 32,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.heading.h8Semibold,
    color: theme.colors.semantic.textPrimary,
  },
  skipText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing[8],
    paddingBottom: theme.spacing[16],
  },
  stepBody: {
    gap: theme.spacing[16],
  },
  searchBox: {
    minHeight: 34,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
    gap: theme.spacing[8],
  },
  searchIcon: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textMuted,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textPrimary,
    paddingVertical: theme.spacing[8],
  },
  suggestionList: {
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  suggestionRow: {
    minHeight: 34,
    paddingHorizontal: theme.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  addNewBullet: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.primaryBlue[500],
  },
  suggestionPrimaryText: {
    flex: 1,
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.primaryBlue[500],
  },
  suggestionText: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dosageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[8],
  },
  dosageChip: {
    minWidth: 52,
    minHeight: 32,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dosageChipSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  dosageChipText: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dosageChipTextSelected: {
    color: theme.colors.primaryBlue[600],
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  formCard: {
    width: '31%',
    minHeight: 62,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  formCardSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  formIcon: {
    fontSize: 18,
  },
  formLabel: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  formLabelSelected: {
    color: theme.colors.primaryBlue[600],
  },
  iconPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  iconChipText: {
    fontSize: 20,
  },
  doseCountRow: {
    gap: theme.spacing[8],
  },
  frequencySummary: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[600],
  },
  doseCountChipRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  weekdayChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  weekdayChip: {
    minWidth: 46,
    minHeight: 34,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  weekdayChipSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  weekdayChipText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  weekdayChipTextSelected: {
    color: theme.colors.primaryBlue[600],
    fontWeight: '700',
  },
  selectionHint: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  doseCountChip: {
    minWidth: 48,
    minHeight: 34,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseCountChipSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  doseCountChipText: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textSecondary,
  },
  doseCountChipTextSelected: {
    color: theme.colors.primaryBlue[600],
  },
  timeWarning: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.error[500],
  },
  selectionRow: {
    minHeight: 42,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  selectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  selectionIcon: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textMuted,
  },
  selectionLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  selectionValue: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  selectionChevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  noteLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  noteInput: {
    minHeight: 170,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  footer: {
    paddingBottom: theme.spacing[8],
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.semantic.overlay,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[8],
    paddingBottom: theme.spacing[16],
    gap: theme.spacing[16],
  },
  sheetHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  sheetClose: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  intervalWrap: {
    gap: theme.spacing[8],
  },
  intervalOption: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[16],
  },
  intervalOptionSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  intervalOptionText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  intervalOptionTextSelected: {
    color: theme.colors.primaryBlue[600],
    fontWeight: '700',
  },
  calendarWrap: {
    gap: theme.spacing[16],
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthArrow: {
    ...theme.typography.heading.h6Medium,
    color: theme.colors.semantic.textSecondary,
  },
  monthTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
  },
  dayHeaderText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius[8],
  },
  calendarCellSelected: {
    backgroundColor: theme.colors.primaryBlue[50],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[500],
  },
  calendarCellDisabled: {
    backgroundColor: theme.colors.neutral[100],
    opacity: 0.45,
  },
  calendarCellText: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textSecondary,
  },
  calendarCellTextSelected: {
    color: theme.colors.primaryBlue[600],
    fontWeight: '600',
  },
  calendarCellTextDisabled: {
    color: theme.colors.semantic.textMuted,
  },
  timeWrap: {
    gap: theme.spacing[16],
  },
  timeSectionLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  timeHorizontalList: {
    gap: theme.spacing[8],
    paddingRight: theme.spacing[8],
  },
  timeUnitChip: {
    minWidth: 52,
    minHeight: 40,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  timeUnitChipSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  timeUnitChipText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  timeUnitChipTextSelected: {
    color: theme.colors.primaryBlue[600],
  },
});
