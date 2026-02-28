import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { getTranslations, type Locale } from '../features/localization/localization';
import { useMedicationDetailsScreenState } from '../features/medications/application/use-medication-details-screen-state';
import { theme } from '../theme';

type MedicationDetailsScreenProps = {
  locale: Locale;
  medicationId: string;
  onBack: () => void;
};

export function MedicationDetailsScreen({ locale, medicationId, onBack }: MedicationDetailsScreenProps) {
  const t = getTranslations(locale);
  const { medication, name, setName, dosage, setDosage, frequencyLabel, setFrequencyLabel, time, setTime, note, setNote, message, save } =
    useMedicationDetailsScreenState(medicationId, t.saved);

  if (!medication) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={t.medicationDetails} leftAction={{ icon: 'back', onPress: onBack }} />
        <Text style={styles.notFound}>{t.medicationNotFound}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.medicationDetails} leftAction={{ icon: 'back', onPress: onBack }} />

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
          void (async () => {
            const isSaved = await save();
            if (isSaved) {
              setTimeout(() => onBack(), 300);
            }
          })();
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
