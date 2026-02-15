import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/app-header';
import { PrimaryButton } from '../components/ui/primary-button';
import { TextField } from '../components/ui/text-field';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
  fontScale: number;
};

export function AddMedsScreen({ locale, fontScale }: AddMedsScreenProps) {
  const t = getTranslations(locale);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [reminder, setReminder] = useState('08:00');
  const [feedback, setFeedback] = useState('');

  const canSave = name.trim().length > 0 && reminder.trim().length > 0;

  return (
    <View style={styles.container}>
      <AppHeader title={t.addMeds} subtitle="5 adimli hizli ilac ekleme" />

      <View style={styles.form}>
        <TextField label="Medication name" value={name} placeholder="Input" helperText="Required" onChangeText={setName} />
        <TextField label="Dosage" value={dosage} placeholder="Input" helperText="Optional" onChangeText={setDosage} />
        <TextField
          label="Frequency"
          value={frequency}
          placeholder="Daily / Weekly"
          helperText="Required"
          onChangeText={setFrequency}
        />
        <TextField label="Reminder time" value={reminder} placeholder="08:00" helperText="HH:mm" onChangeText={setReminder} />
      </View>

      <PrimaryButton
        label="Done"
        disabled={!canSave}
        onPress={() => {
          setFeedback(`${name} kaydedildi.`);
          setName('');
          setDosage('');
          setFrequency('Daily');
          setReminder('08:00');
        }}
      />

      {feedback ? (
        <Text
          style={{
            ...theme.typography.bodyScale.mRegular,
            fontSize: theme.typography.bodyScale.mRegular.fontSize * fontScale,
            lineHeight: theme.typography.bodyScale.mRegular.lineHeight * fontScale,
            color: theme.colors.semantic.stateSuccess,
          }}
        >
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing[16],
  },
  form: {
    gap: theme.spacing[16],
  },
});
