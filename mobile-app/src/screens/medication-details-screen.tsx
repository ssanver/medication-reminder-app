import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getMedicationById, updateMedication } from '../features/medications/medication-store';
import { theme } from '../theme';

type MedicationDetailsScreenProps = {
  locale: Locale;
  medicationId: string;
  onBack: () => void;
};

export function MedicationDetailsScreen({ locale, medicationId, onBack }: MedicationDetailsScreenProps) {
  const t = getTranslations(locale);
  const medication = useMemo(() => getMedicationById(medicationId), [medicationId]);
  const [name, setName] = useState(medication?.name ?? '');
  const [dosage, setDosage] = useState(medication?.dosage ?? '1');
  const [frequencyLabel, setFrequencyLabel] = useState(medication?.frequencyLabel ?? 'Every 1 Day');
  const [time, setTime] = useState(medication?.time ?? '09:00');
  const [note, setNote] = useState(medication?.note ?? '');
  const [message, setMessage] = useState('');

  if (!medication) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={t.medicationDetails} leftAction={{ icon: '<', onPress: onBack }} />
        <Text style={styles.notFound}>{t.medicationNotFound}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.medicationDetails} leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.card}>
        <TextField label={t.medicationName} value={name} onChangeText={setName} />
        <TextField label={t.dosage} value={dosage} onChangeText={setDosage} />
        <TextField label={t.frequency} value={frequencyLabel} onChangeText={setFrequencyLabel} />
        <TextField label={t.time} value={time} onChangeText={setTime} />
        <TextField label={t.note} value={note} onChangeText={setNote} />
      </View>

      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Button
        label={t.save}
        onPress={() => {
          void updateMedication(medicationId, {
            name: name.trim() || medication.name,
            dosage: dosage.trim() || medication.dosage,
            frequencyLabel: frequencyLabel.trim() || medication.frequencyLabel,
            time: time.trim() || medication.time,
            note: note.trim(),
          });
          setMessage(t.saved);
          setTimeout(() => onBack(), 300);
        }}
      />
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
    paddingBottom: theme.spacing[24],
  },
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  success: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.success[500],
    textAlign: 'center',
  },
  notFound: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[24],
  },
});
