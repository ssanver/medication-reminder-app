import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from '../components/ui/app-icon';
import { BottomSheetHandle } from '../components/ui/bottom-sheet-handle';
import { Button } from '../components/ui/button';
import { loadAppDefinitions, type AppDefinitions, type FormOption } from '../features/definitions/definitions-service';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { localizeFormLabel } from '../features/localization/medication-localization';
import {
  alignDateToWeekday,
  buildCalendarCells,
  formatDate,
  getAdvancedFrequencySummary,
  getOrderedWeekdayOptions,
  getWeekdayLabel,
  parseDateKey,
  resolveFrequencyPreset,
  shiftMonth,
  splitTime,
  steps,
  type FrequencyPreset,
  type IntervalUnit,
  type WizardStep,
  type WeekStartsOn,
} from '../features/medications/add-medication-use-case';
import { searchMedicineCatalog } from '../features/medications/medicine-catalog-service';
import { addMedication, getMedicationById, updateMedication } from '../features/medications/medication-store';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  weekStartsOn: WeekStartsOn;
  onMedicationSaved: () => void;
  mode?: 'create' | 'edit';
  medicationId?: string;
  onBack?: () => void;
};

type SheetType = 'none' | 'date' | 'time' | 'interval' | 'form';
type DateField = 'start' | 'end';

function resolveFormDefaultIcon(formKey: string, formOptions: FormOption[]): string {
  return formOptions.find((item) => item.key === formKey)?.emoji ?? (formOptions[0]?.emoji ?? '');
}

export function AddMedsScreen({
  locale,
  fontScale: _fontScale,
  weekStartsOn,
  onMedicationSaved,
  mode = 'create',
  medicationId,
  onBack: onNavigateBack,
}: AddMedsScreenProps) {
  const t = getTranslations(locale);
  const [step, setStep] = useState<WizardStep>('name');
  const [sheet, setSheet] = useState<SheetType>('none');
  const [definitions, setDefinitions] = useState<AppDefinitions | null>(null);

  const [name, setName] = useState('');
  const [form, setForm] = useState('');
  const [iconEmoji, setIconEmoji] = useState('');
  const [dosage, setDosage] = useState('0.5');
  const [isBeforeMeal, setIsBeforeMeal] = useState(false);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('day');
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [cycleOffDays, setCycleOffDays] = useState<number>(7);
  const [advancedMode, setAdvancedMode] = useState<'interval' | 'multi' | 'weekdays' | 'cycle'>('interval');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [dosesPerDay, setDosesPerDay] = useState<number>(1);
  const [forceCustomFrequency, setForceCustomFrequency] = useState(false);
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [useEndDate, setUseEndDate] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState('');
  const [doseTimes, setDoseTimes] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [catalogSuggestions, setCatalogSuggestions] = useState<string[]>([]);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [draftDate, setDraftDate] = useState(startDate);
  const [dateField, setDateField] = useState<DateField>('start');
  const [draftHour, setDraftHour] = useState('09');
  const [draftMinute, setDraftMinute] = useState('00');
  const [editingTimeIndex, setEditingTimeIndex] = useState(0);
  const editingMedication = useMemo(
    () => (mode === 'edit' && medicationId ? getMedicationById(medicationId) : undefined),
    [medicationId, mode],
  );

  const stepIndex = steps.indexOf(step);
  const progress = (stepIndex + 1) / steps.length;
  const defaultDoseTimes = definitions?.defaultDoseTimes ?? [];
  const dayIntervalOptions = definitions?.dayIntervalOptions ?? [];
  const hourIntervalOptions = definitions?.hourIntervalOptions ?? [];
  const cycleOnDayOptions = definitions?.cycleOnDayOptions ?? [];
  const cycleOffDayOptions = definitions?.cycleOffDayOptions ?? [];
  const dosesPerDayOptions = definitions?.dosesPerDayOptions ?? [];
  const hourOptions = definitions?.hourOptions ?? [];
  const minuteOptions = definitions?.minuteOptions ?? [];
  const medicationIconOptions = definitions?.medicationIconOptions ?? [];
  const formOptions = definitions?.formOptions ?? [];
  const weekdayOptions = definitions?.weekdayOptions ?? [];
  const preferredDayInterval = dayIntervalOptions.find((item) => item > 1) ?? dayIntervalOptions[0] ?? 1;
  const preferredHourInterval = hourIntervalOptions.find((item) => item > 1) ?? hourIntervalOptions[0] ?? 1;
  const preferredCycleOnDays = cycleOnDayOptions[0] ?? 1;
  const preferredCycleOffDays = cycleOffDayOptions[0] ?? 1;
  const multiDoseOptions = dosesPerDayOptions.filter((item) => item >= 3);

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
  const selectedDoseTimes = useMemo(
    () => Array.from({ length: dosesPerDay }, (_, index) => doseTimes[index] ?? defaultDoseTimes[index] ?? ''),
    [defaultDoseTimes, doseTimes, dosesPerDay],
  );
  const orderedWeekdays = useMemo(() => getOrderedWeekdayOptions(weekStartsOn, weekdayOptions), [weekStartsOn, weekdayOptions]);
  const selectedWeekday = selectedWeekdays[0] ?? orderedWeekdays[0] ?? 0;
  const resolvedFrequencyPreset = useMemo<FrequencyPreset>(
    () => resolveFrequencyPreset(intervalUnit, intervalCount, dosesPerDay),
    [dosesPerDay, intervalCount, intervalUnit],
  );
  const isCustomFrequency = forceCustomFrequency || resolvedFrequencyPreset === 'custom';
  const isIntervalAdvancedMode = isCustomFrequency && advancedMode === 'interval';
  const isWeekdaysAdvancedMode = isCustomFrequency && advancedMode === 'weekdays';
  const isCycleAdvancedMode = isCustomFrequency && advancedMode === 'cycle';
  const isHourlyIntervalMode = isIntervalAdvancedMode && intervalUnit === 'hour';
  const usesSingleDoseTime = isIntervalAdvancedMode || isWeekdaysAdvancedMode || isCycleAdvancedMode;
  const singleIntervalDoseTime = selectedDoseTimes[0] ?? '--:--';
  const frequencySummary = useMemo(
    () =>
      getAdvancedFrequencySummary({
        intervalUnit,
        intervalCount,
        dosesPerDay,
        cycleOnDays: intervalCount,
        cycleOffDays,
        locale,
      }),
    [cycleOffDays, dosesPerDay, intervalCount, intervalUnit, locale],
  );
  const effectiveStartDate = useMemo(() => {
    if (intervalUnit !== 'week') {
      return startDate;
    }

    const currentWeekday = parseDateKey(startDate).getDay();
    if (selectedWeekdays.includes(currentWeekday)) {
      return startDate;
    }

    return alignDateToWeekday(startDate, selectedWeekday);
  }, [intervalUnit, selectedWeekday, selectedWeekdays, startDate]);
  const hasDuplicateTimes = useMemo(
    () => new Set(selectedDoseTimes.map((item) => item.trim())).size !== selectedDoseTimes.length,
    [selectedDoseTimes],
  );
  const isEndDateValid = useMemo(() => {
    if (!useEndDate) {
      return true;
    }
    return parseDateKey(endDate).getTime() >= parseDateKey(startDate).getTime();
  }, [endDate, startDate, useEndDate]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const loaded = await loadAppDefinitions();
        if (!isMounted) {
          return;
        }

        setDefinitions(loaded);
        setDoseTimes((prev) => (prev.length > 0 ? prev : loaded.defaultDoseTimes));
        setSelectedWeekdays((prev) => (prev.length > 0 ? prev : (loaded.weekdayOptions[0] !== undefined ? [loaded.weekdayOptions[0]] : [])));
        setIconEmoji((prev) => (prev || loaded.medicationIconOptions[0] || ''));
      } catch {
        if (!isMounted) {
          return;
        }
        setDefinitions({
          defaultDoseTimes: [],
          dayIntervalOptions: [],
          weekIntervalOptions: [],
          hourIntervalOptions: [],
          cycleOnDayOptions: [],
          cycleOffDayOptions: [],
          dosesPerDayOptions: [],
          weekdayOptions: [],
          hourOptions: [],
          minuteOptions: [],
          medicationIconOptions: [],
          formOptions: [],
          snoozeOptions: [],
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (intervalUnit !== 'week') {
      return;
    }

    const currentWeekday = parseDateKey(startDate).getDay();
    if (!selectedWeekdays.includes(currentWeekday)) {
      const aligned = alignDateToWeekday(startDate, selectedWeekday);
      if (aligned !== startDate) {
        setStartDate(aligned);
      }
    }
  }, [intervalUnit, selectedWeekday, selectedWeekdays, startDate]);

  useEffect(() => {
    if (intervalUnit !== 'week') {
      return;
    }

    setSelectedWeekdays((prev) => {
      const unique = Array.from(new Set(prev));
      if (unique.length > intervalCount) {
        return unique.slice(0, intervalCount);
      }
      if (unique.length > 0) {
        return unique;
      }
      return orderedWeekdays[0] !== undefined ? [orderedWeekdays[0]] : [];
    });
  }, [intervalCount, intervalUnit, orderedWeekdays]);

  useEffect(() => {
    if (mode !== 'edit' || !editingMedication) {
      return;
    }

    const presetTimes =
      Array.isArray(editingMedication.times) && editingMedication.times.length > 0
        ? editingMedication.times
        : [editingMedication.time ?? defaultDoseTimes[0] ?? ''];

    setName(editingMedication.name);
    setForm(editingMedication.form);
    setIconEmoji(editingMedication.iconEmoji || resolveFormDefaultIcon(editingMedication.form, formOptions));
    setDosage(editingMedication.dosage || '1');
    setIsBeforeMeal(Boolean(editingMedication.isBeforeMeal));
    setIntervalCount(Math.max(1, editingMedication.intervalCount ?? 1));
    setCycleOffDays(Math.max(0, editingMedication.cycleOffDays ?? preferredCycleOffDays));
    setSelectedWeekdays(
      Array.isArray(editingMedication.weeklyDays) && editingMedication.weeklyDays.length > 0
        ? editingMedication.weeklyDays
        : [parseDateKey(editingMedication.startDate).getDay()],
    );
    setDosesPerDay(Math.min(6, Math.max(1, presetTimes.length)));
    setStartDate(editingMedication.startDate);
    setUseEndDate(Boolean(editingMedication.endDate));
    setEndDate(editingMedication.endDate ?? editingMedication.startDate);
    setTotalQuantity(
      typeof editingMedication.totalQuantity === 'number' && editingMedication.totalQuantity > 0
        ? `${editingMedication.totalQuantity}`
        : '',
    );
    setDoseTimes([...presetTimes, ...defaultDoseTimes].slice(0, Math.max(1, defaultDoseTimes.length, presetTimes.length)));
    setNote(editingMedication.note ?? '');
    const normalizedIntervalUnit = editingMedication.intervalUnit === 'as-needed' ? 'day' : editingMedication.intervalUnit;
    setIntervalUnit(normalizedIntervalUnit ?? 'day');
    setAdvancedMode(
      normalizedIntervalUnit === 'cycle'
        ? 'cycle'
        : normalizedIntervalUnit === 'week'
          ? 'weekdays'
          : normalizedIntervalUnit === 'day' && Math.max(1, presetTimes.length) > 2
            ? 'multi'
            : 'interval',
    );
    setForceCustomFrequency(
      resolveFrequencyPreset(
        editingMedication.intervalUnit ?? 'day',
        Math.max(1, editingMedication.intervalCount ?? 1),
        Math.min(3, Math.max(1, presetTimes.length)),
      ) === 'custom',
    );
    setStep('name');
  }, [editingMedication, mode]);

  useEffect(() => {
    if (resolvedFrequencyPreset !== 'custom') {
      setForceCustomFrequency(false);
    }
  }, [resolvedFrequencyPreset]);

  useEffect(() => {
    const query = name.trim();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const items = await searchMedicineCatalog(query, query.length === 0 ? 30 : 20);
          setCatalogSuggestions(items);
        } catch {
          setCatalogSuggestions([]);
        }
      })();
    }, 250);

    return () => clearTimeout(timer);
  }, [name]);

  const canProceed =
    (step === 'name' && name.trim().length > 1) ||
    (step === 'form-dose' && form.length > 0) ||
    (step === 'frequency' &&
      Boolean(startDate) &&
      (intervalUnit !== 'week' || selectedWeekdays.length >= 1) &&
      selectedDoseTimes.every((item) => item.trim().length > 0) &&
      !hasDuplicateTimes &&
      isEndDateValid) ||
    step === 'note';

  const headerTitle =
    step === 'name'
      ? t.medicationName
      : step === 'form-dose'
        ? t.selectForm
        : step === 'frequency'
          ? t.frequency
          : t.note;

  async function handleSave(shouldSkipNote = false) {
    const normalizedName = name.trim();
    const parsedTotalQuantity = Number(totalQuantity);
    const normalizedTotalQuantity =
      Number.isFinite(parsedTotalQuantity) && parsedTotalQuantity > 0 ? Math.floor(parsedTotalQuantity) : undefined;
    if (!normalizedName || !form || selectedDoseTimes.length === 0) {
      return;
    }

    if (mode === 'edit' && medicationId) {
      await updateMedication(medicationId, {
        name: normalizedName,
        form,
        iconEmoji,
        dosage,
        isBeforeMeal,
        intervalUnit,
        intervalCount,
        cycleOffDays,
        note: note.trim(),
        startDate: effectiveStartDate,
        endDate: useEndDate ? endDate : null,
        time: selectedDoseTimes[0],
        times: selectedDoseTimes,
        weeklyDays: intervalUnit === 'week' ? selectedWeekdays : undefined,
        totalQuantity: normalizedTotalQuantity,
      });
    } else {
      await addMedication({
        name: normalizedName,
        form,
        iconEmoji,
        dosage,
        isBeforeMeal,
        intervalUnit,
        intervalCount,
        cycleOffDays,
        note: shouldSkipNote ? '' : note.trim(),
        startDate: effectiveStartDate,
        endDate: useEndDate ? endDate : null,
        time: selectedDoseTimes[0],
        times: selectedDoseTimes,
        weeklyDays: intervalUnit === 'week' ? selectedWeekdays : undefined,
        totalQuantity: normalizedTotalQuantity,
        active: true,
      });

      setName('');
      setForm('');
      setIconEmoji(medicationIconOptions[0] ?? '');
      setDosage('0.5');
      setIsBeforeMeal(false);
      setIntervalUnit('day');
      setIntervalCount(1);
      setCycleOffDays(preferredCycleOffDays);
      setAdvancedMode('interval');
      setSelectedWeekdays(orderedWeekdays[0] !== undefined ? [orderedWeekdays[0]] : []);
      setDosesPerDay(1);
      setStartDate(formatDate(new Date()));
      setUseEndDate(false);
      setEndDate(formatDate(new Date()));
      setTotalQuantity('');
      setDoseTimes(defaultDoseTimes);
      setNote('');
      setStep('name');
    }

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

  function handleBack() {
    if (stepIndex === 0) {
      onNavigateBack?.();
      return;
    }
    setStep(steps[stepIndex - 1]);
  }

  function openDateSheet(target: DateField = 'start') {
    const initialDate = target === 'end'
      ? endDate
      : intervalUnit === 'week'
        ? alignDateToWeekday(startDate, selectedWeekday)
        : startDate;
    setDateField(target);
    setDraftDate(initialDate);
    setCalendarMonth(parseDateKey(initialDate));
    setSheet('date');
  }

  function openFormSheet() {
    setSheet('form');
  }

  function openTimeSheet(index: number) {
    setEditingTimeIndex(index);
    const initialTime = doseTimes[index] ?? defaultDoseTimes[index] ?? '';
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
          <Pressable style={styles.selectionRow} onPress={openFormSheet}>
            <View style={styles.selectionLeft}>
              <Text style={styles.selectionIcon}>💊</Text>
              <Text style={styles.selectionLabel}>{t.form}</Text>
            </View>
            <View style={styles.selectionRight}>
              <Text style={styles.selectionValue}>
                {form ? localizeFormLabel(form, locale) : t.select}
              </Text>
              <Text style={styles.selectionChevron}>›</Text>
            </View>
          </Pressable>

          <View style={styles.doseCountRow}>
            <Text style={styles.selectionLabel}>{t.medicationIcon}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconPickerRow}>
              {medicationIconOptions.map((option) => {
                const selected = iconEmoji === option;
                return (
                  <Pressable key={option} onPress={() => setIconEmoji(option)} style={[styles.iconChip, selected && styles.iconChipSelected]}>
                    <Text style={styles.iconChipText}>{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      );
    }

    if (step === 'frequency') {
      return (
        <View style={styles.stepBody}>
          <View style={styles.doseCountRow}>
            <Text style={styles.selectionLabel}>{t.mealPreference}</Text>
            <View style={styles.mealPreferenceRow}>
              <Pressable
                onPress={() => setIsBeforeMeal(true)}
                style={[styles.mealPreferenceChip, isBeforeMeal && styles.doseCountChipSelected]}
              >
                <Text style={[styles.doseCountChipText, isBeforeMeal && styles.doseCountChipTextSelected]}>
                  {t.beforeMeal}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsBeforeMeal(false)}
                style={[styles.mealPreferenceChip, !isBeforeMeal && styles.doseCountChipSelected]}
              >
                <Text style={[styles.doseCountChipText, !isBeforeMeal && styles.doseCountChipTextSelected]}>
                  {t.afterMeal}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.doseCountRow}>
            <Text style={styles.selectionLabel}>{t.frequency}</Text>
            <View style={styles.frequencyPresetRow}>
              <Pressable
                style={[styles.frequencyPresetChip, resolvedFrequencyPreset === 'once-daily' && !isCustomFrequency && styles.frequencyPresetChipSelected]}
                onPress={() => {
                  setIntervalUnit('day');
                  setIntervalCount(1);
                  setDosesPerDay(1);
                  setAdvancedMode('interval');
                  setForceCustomFrequency(false);
                }}
              >
                <Text style={[styles.frequencyPresetChipText, resolvedFrequencyPreset === 'once-daily' && !isCustomFrequency && styles.frequencyPresetChipTextSelected]}>
                  {t.frequencyOnceDaily}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.frequencyPresetChip, resolvedFrequencyPreset === 'twice-daily' && !isCustomFrequency && styles.frequencyPresetChipSelected]}
                onPress={() => {
                  setIntervalUnit('day');
                  setIntervalCount(1);
                  setDosesPerDay(2);
                  setAdvancedMode('multi');
                  setForceCustomFrequency(false);
                }}
              >
                <Text style={[styles.frequencyPresetChipText, resolvedFrequencyPreset === 'twice-daily' && !isCustomFrequency && styles.frequencyPresetChipTextSelected]}>
                  {t.frequencyTwiceDaily}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.frequencyPresetChip, isCustomFrequency && styles.frequencyPresetChipSelected]}
                onPress={() => {
                  setForceCustomFrequency(true);
                  setAdvancedMode('interval');
                  setIntervalUnit('day');
                  setIntervalCount(preferredDayInterval);
                  setDosesPerDay(1);
                }}
              >
                <Text style={[styles.frequencyPresetChipText, isCustomFrequency && styles.frequencyPresetChipTextSelected]}>
                  {t.frequencyMoreOptions}
                </Text>
              </Pressable>
            </View>
          </View>

          {isCustomFrequency ? (
            <View style={styles.advancedModeSection}>
              <View style={styles.advancedModeSelectorRow}>
                <Pressable
                  onPress={() => {
                    setAdvancedMode('interval');
                    if (intervalUnit !== 'day' && intervalUnit !== 'hour') {
                      setIntervalUnit('day');
                      setIntervalCount(preferredDayInterval);
                    }
                    setDosesPerDay(1);
                  }}
                  style={[styles.frequencyPresetChip, advancedMode === 'interval' && styles.frequencyPresetChipSelected]}
                >
                  <Text style={[styles.frequencyPresetChipText, advancedMode === 'interval' && styles.frequencyPresetChipTextSelected]}>
                    {t.interval}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setAdvancedMode('multi');
                    setIntervalUnit('day');
                    setIntervalCount(1);
                    setDosesPerDay(Math.max(3, dosesPerDay));
                  }}
                  style={[styles.frequencyPresetChip, advancedMode === 'multi' && styles.frequencyPresetChipSelected]}
                >
                  <Text style={[styles.frequencyPresetChipText, advancedMode === 'multi' && styles.frequencyPresetChipTextSelected]}>
                    {t.multipleDosesPerDay}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setAdvancedMode('weekdays');
                    setIntervalUnit('week');
                    setIntervalCount(1);
                    setDosesPerDay(1);
                  }}
                  style={[styles.frequencyPresetChip, advancedMode === 'weekdays' && styles.frequencyPresetChipSelected]}
                >
                  <Text style={[styles.frequencyPresetChipText, advancedMode === 'weekdays' && styles.frequencyPresetChipTextSelected]}>
                    {t.daysOfWeek}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setAdvancedMode('cycle');
                    setIntervalUnit('cycle');
                    setIntervalCount(preferredCycleOnDays);
                    setCycleOffDays(preferredCycleOffDays);
                    setDosesPerDay(1);
                  }}
                  style={[styles.frequencyPresetChip, advancedMode === 'cycle' && styles.frequencyPresetChipSelected]}
                >
                  <Text style={[styles.frequencyPresetChipText, advancedMode === 'cycle' && styles.frequencyPresetChipTextSelected]}>
                    {t.cycleMode}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.advancedModeCard}>
                {advancedMode === 'interval' ? (
                  <View style={styles.doseCountRow}>
                    <Text style={styles.selectionLabel}>{t.interval}</Text>
                    <Text style={styles.selectionHint}>{t.intervalHint}</Text>
                    <View style={styles.intervalUnitRow}>
                      <Pressable
                        onPress={() => {
                          setIntervalUnit('hour');
                          setIntervalCount(preferredHourInterval);
                          setDosesPerDay(1);
                        }}
                        style={[styles.intervalUnitCard, intervalUnit === 'hour' && styles.intervalUnitCardSelected]}
                      >
                        <Text style={[styles.intervalUnitTitle, intervalUnit === 'hour' && styles.intervalUnitTitleSelected]}>{t.everyXHours}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setIntervalUnit('day');
                          setIntervalCount(preferredDayInterval);
                          setDosesPerDay(1);
                        }}
                        style={[styles.intervalUnitCard, intervalUnit === 'day' && styles.intervalUnitCardSelected]}
                      >
                        <Text style={[styles.intervalUnitTitle, intervalUnit === 'day' && styles.intervalUnitTitleSelected]}>{t.everyXDays}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.doseCountChipRow}>
                      {(intervalUnit === 'hour' ? hourIntervalOptions : dayIntervalOptions).map((count) => {
                        const selected = count === intervalCount;
                        return (
                          <Pressable
                            key={`${intervalUnit}-${count}`}
                            onPress={() => setIntervalCount(count)}
                            style={[styles.doseCountChip, selected && styles.doseCountChipSelected]}
                          >
                            <Text style={[styles.doseCountChipText, selected && styles.doseCountChipTextSelected]}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {advancedMode === 'multi' ? (
                  <View style={styles.doseCountRow}>
                    <Text style={styles.selectionLabel}>{t.multipleDosesPerDay}</Text>
                    <Text style={styles.selectionHint}>{t.multipleDosesPerDayHint}</Text>
                    <View style={styles.doseCountChipRow}>
                      {multiDoseOptions.map((count) => {
                        const selected = count === dosesPerDay;
                        return (
                          <Pressable key={`multi-${count}`} onPress={() => setDosesPerDay(count)} style={[styles.doseCountChip, selected && styles.doseCountChipSelected]}>
                            <Text style={[styles.doseCountChipText, selected && styles.doseCountChipTextSelected]}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {advancedMode === 'weekdays' ? (
                  <View style={styles.doseCountRow}>
                    <Text style={styles.selectionLabel}>{t.daysOfWeek}</Text>
                    <Text style={styles.selectionHint}>{t.weekdaysHint}</Text>
                    <View style={styles.weekdayChipRow}>
                      {orderedWeekdays.map((weekday) => {
                        const selected = selectedWeekdays.includes(weekday);
                        return (
                          <Pressable
                            key={weekday}
                            onPress={() =>
                              setSelectedWeekdays((prev) => {
                                if (prev.includes(weekday)) {
                                  return prev.length === 1 ? prev : prev.filter((item) => item !== weekday);
                                }
                                return [...prev, weekday];
                              })
                            }
                            style={[styles.weekdayChip, selected && styles.weekdayChipSelected]}
                          >
                            <Text style={[styles.weekdayChipText, selected && styles.weekdayChipTextSelected]}>
                              {getWeekdayLabel(weekday, locale)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {advancedMode === 'cycle' ? (
                  <View style={styles.doseCountRow}>
                    <Text style={styles.selectionLabel}>{t.cycleMode}</Text>
                    <Text style={styles.selectionHint}>{t.cycleModeHint}</Text>
                    <Text style={styles.selectionLabel}>{t.cycleOnDays}</Text>
                    <View style={styles.doseCountChipRow}>
                      {cycleOnDayOptions.map((count) => {
                        const selected = count === intervalCount;
                        return (
                          <Pressable key={`on-${count}`} onPress={() => setIntervalCount(count)} style={[styles.doseCountChip, selected && styles.doseCountChipSelected]}>
                            <Text style={[styles.doseCountChipText, selected && styles.doseCountChipTextSelected]}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.selectionLabel}>{t.cycleOffDays}</Text>
                    <View style={styles.doseCountChipRow}>
                      {cycleOffDayOptions.map((count) => {
                        const selected = count === cycleOffDays;
                        return (
                          <Pressable key={`off-${count}`} onPress={() => setCycleOffDays(count)} style={[styles.doseCountChip, selected && styles.doseCountChipSelected]}>
                            <Text style={[styles.doseCountChipText, selected && styles.doseCountChipTextSelected]}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          <Text style={styles.frequencySummary}>{frequencySummary}</Text>

          {!isWeekdaysAdvancedMode ? (
            <View style={styles.doseCountRow}>
              <Text style={styles.selectionLabel}>{t.totalQuantity}</Text>
              <TextInput
                value={totalQuantity}
                onChangeText={(value) => setTotalQuantity(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder={t.quantityExample}
                placeholderTextColor={theme.colors.neutral[400]}
                style={styles.quantityInput}
              />
            </View>
          ) : null}

          <Pressable style={styles.selectionRow} onPress={() => openDateSheet('start')}>
            <View style={styles.selectionLeft}>
              <Text style={styles.selectionIcon}>🗓</Text>
              <Text style={styles.selectionLabel}>{t.startDate}</Text>
            </View>
            <View style={styles.selectionRight}>
              <Text style={styles.selectionValue}>{localizedDate}</Text>
              <Text style={styles.selectionChevron}>›</Text>
            </View>
          </Pressable>

          {usesSingleDoseTime ? (
            <Pressable style={styles.selectionRow} onPress={() => openTimeSheet(0)}>
              <View style={styles.selectionLeft}>
                <Text style={styles.selectionIcon}>⏰</Text>
                <Text style={styles.selectionLabel}>{isHourlyIntervalMode ? t.startTime : t.doseTime}</Text>
              </View>
              <View style={styles.selectionRight}>
                <Text style={styles.selectionValue}>{singleIntervalDoseTime}</Text>
                <Text style={styles.selectionChevron}>›</Text>
              </View>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.selectionRow}
            onPress={() => {
              if (!useEndDate) {
                setUseEndDate(true);
                if (parseDateKey(endDate).getTime() < parseDateKey(startDate).getTime()) {
                  setEndDate(startDate);
                }
              }
              openDateSheet('end');
            }}
          >
            <View style={styles.selectionLeft}>
              <Text style={styles.selectionIcon}>📍</Text>
              <Text style={styles.selectionLabel}>{t.endDate}</Text>
            </View>
            <View style={styles.selectionRight}>
              <Text style={styles.selectionValue}>
                {useEndDate
                  ? parseDateKey(endDate).toLocaleDateString(getLocaleTag(locale), {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : t.unlimited}
              </Text>
              {useEndDate ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    setUseEndDate(false);
                  }}
                >
                  <Text style={styles.endDateClearText}>{t.clear}</Text>
                </Pressable>
              ) : null}
              <Text style={styles.selectionChevron}>›</Text>
            </View>
          </Pressable>

          {useEndDate && !isEndDateValid ? (
            <Text style={styles.timeWarning}>
              {t.endDateBeforeStart}
            </Text>
          ) : null}

          {!usesSingleDoseTime
            ? selectedDoseTimes.map((slotTime, index) => (
                <Pressable key={`${index}-${slotTime}`} style={styles.selectionRow} onPress={() => openTimeSheet(index)}>
                  <View style={styles.selectionLeft}>
                    <Text style={styles.selectionIcon}>⏰</Text>
                    <Text style={styles.selectionLabel}>{t.doseTimeLabel.replace('{{index}}', `${index + 1}`)}</Text>
                  </View>
                  <View style={styles.selectionRight}>
                    <Text style={styles.selectionValue}>{slotTime || '--:--'}</Text>
                    <Text style={styles.selectionChevron}>›</Text>
                  </View>
                </Pressable>
              ))
            : null}

          {hasDuplicateTimes ? (
            <Text style={styles.timeWarning}>
              {t.duplicateTimeWarning}
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

  const calendarCells = buildCalendarCells(calendarMonth, weekStartsOn);
  const dayHeaders = orderedWeekdays.map((weekday) => getWeekdayLabel(weekday, locale).slice(0, 2).toUpperCase());

  if (mode === 'edit' && !editingMedication) {
    return (
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable onPress={onNavigateBack} style={styles.headerIconButton}>
            <AppIcon name="back" size={16} color={theme.colors.semantic.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.medicationNotFound}</Text>
          <View style={styles.headerIconButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topProgressTrack}>
        <View style={[styles.topProgressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.headerRow}>
        <Pressable onPress={handleBack} disabled={stepIndex === 0 && !onNavigateBack} style={styles.headerIconButton}>
          {stepIndex > 0 || onNavigateBack ? <AppIcon name="back" size={16} color={theme.colors.semantic.textSecondary} /> : null}
        </Pressable>
        <Text style={[styles.headerTitle, { fontSize: theme.typography.heading.h8Semibold.fontSize * _fontScale }]}>{headerTitle}</Text>
        <View style={styles.headerIconButton}>
          {step === 'note' && mode === 'create' ? (
            <Pressable onPress={() => void handleSave(true)} hitSlop={8}>
              <Text style={styles.skipText}>{t.skipLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={step === 'note' ? (mode === 'edit' ? t.saveChanges : t.done) : t.next} onPress={onNext} disabled={!canProceed} size="m" />
      </View>

      <Modal transparent visible={sheet !== 'none'} animationType="slide" onRequestClose={() => setSheet('none')}>
        <Pressable style={styles.overlay} onPress={() => setSheet('none')}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <BottomSheetHandle />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {sheet === 'date'
                  ? dateField === 'end'
                    ? t.selectEndDate
                    : t.selectDate
                  : sheet === 'time'
                    ? t.setTime
                  : sheet === 'form'
                      ? t.selectForm
                    : t.selectIntervalType}
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
                    {t.day}
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
                    {t.week}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {sheet === 'form' ? (
              <View style={styles.intervalWrap}>
                {formOptions.map((item) => {
                  const selected = form === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.intervalOption, selected && styles.intervalOptionSelected]}
                      onPress={() => {
                        setForm(item.key);
                        setIconEmoji(resolveFormDefaultIcon(item.key, formOptions));
                        setSheet('none');
                      }}
                    >
                      <Text style={[styles.intervalOptionText, selected && styles.intervalOptionTextSelected]}>
                        {`${item.emoji} ${localizeFormLabel(item.key, locale)}`}
                      </Text>
                    </Pressable>
                  );
                })}
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
                    const selectable =
                      dateField === 'end' ||
                      intervalUnit !== 'week' ||
                      selectedWeekdays.includes(dateCell.getDay());

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
                    if (dateField === 'end') {
                      setEndDate(draftDate);
                    } else {
                      setStartDate(draftDate);
                      if (useEndDate && parseDateKey(endDate).getTime() < parseDateKey(draftDate).getTime()) {
                        setEndDate(draftDate);
                      }
                    }
                    setSheet('none');
                  }}
                />
              </View>
            ) : null}

            {sheet === 'time' ? (
              <View style={styles.timeWrap}>
                <Text style={styles.timeSectionLabel}>{t.hour}</Text>
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

                <Text style={styles.timeSectionLabel}>{t.minute}</Text>
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
  iconPickerRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
    paddingRight: theme.spacing[8],
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
  frequencyPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  advancedModeSection: {
    gap: theme.spacing[8],
  },
  advancedModeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  advancedModeCard: {
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[8],
    gap: theme.spacing[8],
  },
  advancedModeHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  modeToggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[200],
  },
  modeToggleActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[500],
  },
  frequencyPresetChip: {
    minHeight: 34,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[16],
  },
  frequencyPresetChipSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  frequencyPresetChipText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  frequencyPresetChipTextSelected: {
    color: theme.colors.primaryBlue[600],
    fontWeight: '700',
  },
  frequencySummary: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[600],
  },
  doseCountChipRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  intervalUnitRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  intervalUnitCard: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalUnitCardSelected: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  intervalUnitTitle: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  intervalUnitTitleSelected: {
    color: theme.colors.primaryBlue[600],
    fontWeight: '700',
  },
  mealPreferenceRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  mealPreferenceChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
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
  quantityInput: {
    minHeight: 42,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[8],
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textPrimary,
  },
  endDateClearText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
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
