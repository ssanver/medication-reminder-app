import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/ui/app-header';
import { PrimaryButton } from '../components/ui/primary-button';
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
        <TextInput style={styles.input} placeholder="Medication name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Dosage" value={dosage} onChangeText={setDosage} />
        <TextInput style={styles.input} placeholder="Frequency (Daily/Weekly)" value={frequency} onChangeText={setFrequency} />
        <TextInput style={styles.input} placeholder="Reminder time (HH:mm)" value={reminder} onChangeText={setReminder} />
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
            ...theme.typography.body,
            fontSize: theme.typography.body.fontSize * fontScale,
            lineHeight: theme.typography.body.lineHeight * fontScale,
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.radius[8],
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
  },
});
