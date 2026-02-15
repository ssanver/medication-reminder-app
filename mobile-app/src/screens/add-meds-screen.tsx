import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
  fontScale: number;
};

type WizardStep = 'name' | 'form' | 'frequency' | 'dosage' | 'note';

const stepOrder: WizardStep[] = ['name', 'form', 'frequency', 'dosage', 'note'];

export function AddMedsScreen({ locale }: AddMedsScreenProps) {
  const t = getTranslations(locale);
  const stepLabels: Record<WizardStep, string> = {
    name: t.medicationName,
    form: t.selectForm,
    frequency: t.frequency,
    dosage: t.selectDosage,
    note: t.note,
  };
  const [step, setStep] = useState<WizardStep>('name');
  const [name, setName] = useState('');
  const [form, setForm] = useState('Capsule');
  const [frequency, setFrequency] = useState('Every 1 Day');
  const [dosage, setDosage] = useState('1 - 1');
  const [note, setNote] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const stepIndex = stepOrder.indexOf(step);
  const isLastStep = step === 'note';

  const canGoNext = useMemo(() => {
    if (step === 'name') {
      return name.trim().length > 1;
    }

    return true;
  }, [step, name]);

  function goNext() {
    if (!canGoNext) {
      return;
    }

    if (isLastStep) {
      setSavedMessage(t.medicationCreated);
      return;
    }

    setStep(stepOrder[stepIndex + 1]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{stepLabels[step]}</Text>
      <View style={styles.progressRow}>
        {stepOrder.map((key, index) => (
          <View key={key} style={[styles.progressDot, index <= stepIndex && styles.progressDotActive]} />
        ))}
      </View>

      <View style={styles.card}>
        {step === 'name' ? (
          <View style={styles.block}>
            <TextField label={t.medicationName} value={name} placeholder="Metformin" helperText={t.required} onChangeText={setName} />
            <View style={styles.suggestList}>
              {['Acetaminophen', 'Ibuprofen', 'Aspirin', 'Amoxicillin'].map((suggestion) => (
                <Pressable key={suggestion} style={styles.suggestItem} onPress={() => setName(suggestion)}>
                  <Text style={styles.suggestText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 'form' ? (
          <View style={styles.choiceGrid}>
            {['Capsule', 'Pill', 'Drop', 'Syrup', 'Injection', 'Other'].map((option) => {
              const selected = form === option;

              return (
                <Pressable key={option} style={[styles.choiceItem, selected && styles.choiceItemActive]} onPress={() => setForm(option)}>
                  <Text style={[styles.choiceIcon, selected && styles.choiceIconActive]}>💊</Text>
                  <Text style={[styles.choiceText, selected && styles.choiceTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 'frequency' ? (
          <View style={styles.block}>
            {['Every 1 Day', 'Every 3 Days', 'Every 1 Hour'].map((option) => {
              const selected = frequency === option;

              return (
                <Pressable key={option} style={[styles.rowButton, selected && styles.rowButtonActive]} onPress={() => setFrequency(option)}>
                  <Text style={[styles.rowButtonText, selected && styles.rowButtonTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 'dosage' ? (
          <View style={styles.block}>
            {['0.5 - 0.5', '1 - 1', '2 - 2'].map((option) => {
              const selected = dosage === option;

              return (
                <Pressable key={option} style={[styles.rowButton, selected && styles.rowButtonActive]} onPress={() => setDosage(option)}>
                  <Text style={[styles.rowButtonText, selected && styles.rowButtonTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 'note' ? (
          <View style={styles.block}>
            <TextField
              label="Note"
              value={note}
              placeholder={locale === 'tr' ? 'Ilac hakkinda istege bagli not' : 'Optional note about the medication'}
              helperText={t.optional}
              onChangeText={setNote}
            />
            <View style={styles.summary}>
              <Text style={styles.summaryLine}>{`${t.name}: ${name || '-'}`}</Text>
              <Text style={styles.summaryLine}>{`${t.form}: ${form}`}</Text>
              <Text style={styles.summaryLine}>{`${t.frequency}: ${frequency}`}</Text>
              <Text style={styles.summaryLine}>{`${t.dosage}: ${dosage}`}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {savedMessage ? <Text style={styles.success}>{savedMessage}</Text> : null}

      <View style={styles.actions}>
        {stepIndex > 0 ? (
          <Button
            label={t.back}
            variant="outlined"
            onPress={() => {
              setSavedMessage('');
              setStep(stepOrder[stepIndex - 1]);
            }}
          />
        ) : null}
        <Button label={isLastStep ? t.done : t.next} onPress={goNext} disabled={!canGoNext} />
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
  title: {
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
    alignSelf: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.neutral[300],
  },
  progressDotActive: {
    width: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryBlue[500],
  },
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    ...theme.elevation.card,
  },
  block: {
    gap: theme.spacing[8],
  },
  suggestList: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.divider,
    paddingTop: theme.spacing[8],
    gap: theme.spacing[4],
  },
  suggestItem: {
    minHeight: 30,
    justifyContent: 'center',
  },
  suggestText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  choiceItem: {
    width: '31%',
    minHeight: 72,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
    backgroundColor: theme.colors.neutral[50],
  },
  choiceItemActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  choiceIcon: {
    fontSize: 18,
  },
  choiceIconActive: {
    color: theme.colors.primaryBlue[500],
  },
  choiceText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  choiceTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  rowButton: {
    minHeight: 40,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[16],
    backgroundColor: theme.colors.neutral[50],
  },
  rowButtonActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  rowButtonText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  rowButtonTextActive: {
    color: theme.colors.primaryBlue[500],
  },
  summary: {
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    padding: theme.spacing[8],
    gap: theme.spacing[4],
    backgroundColor: theme.colors.neutral[50],
  },
  summaryLine: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  success: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.success[500],
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing[8],
  },
});
