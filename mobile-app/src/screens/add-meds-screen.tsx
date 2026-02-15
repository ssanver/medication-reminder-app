import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type AddMedsScreenProps = {
  locale: Locale;
};

export function AddMedsScreen({ locale }: AddMedsScreenProps) {
  const t = getTranslations(locale);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [feedback, setFeedback] = useState<string>('');

  const canSave = name.trim().length > 0 && reminderTimes.length > 0;

  return (
    <View style={{ gap: theme.spacing[16] }}>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>{t.addMeds}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Medication name"
        style={{ borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: theme.radius[8], padding: 10 }}
      />
      <TextInput
        value={dosage}
        onChangeText={setDosage}
        placeholder="Dosage"
        style={{ borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: theme.radius[8], padding: 10 }}
      />
      <View style={{ flexDirection: 'row', gap: theme.spacing[8] }}>
        <TextInput
          value={newReminderTime}
          onChangeText={setNewReminderTime}
          placeholder="HH:mm"
          style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: theme.radius[8], padding: 10 }}
        />
        <Pressable
          style={{
            minWidth: 90,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius[8],
            borderWidth: 1,
            borderColor: theme.colors.neutral[300],
          }}
          onPress={() => {
            const value = newReminderTime.trim();
            if (value.length === 0 || reminderTimes.includes(value)) {
              return;
            }

            setReminderTimes((previous) => [...previous, value]);
          }}
        >
          <Text>Ekle</Text>
        </Pressable>
      </View>

      <Text style={{ ...theme.typography.caption, color: theme.colors.semantic.textSecondary }}>
        Hatirlatmalar: {reminderTimes.join(', ') || '-'}
      </Text>

      <Pressable
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.semantic.brandPrimary,
          borderRadius: theme.radius[8],
          opacity: canSave ? 1 : 0.35,
        }}
        disabled={!canSave}
        onPress={() => {
          setFeedback(`Kaydedildi: ${name} (${dosage || '-'})`);
          setName('');
          setDosage('');
          setReminderTimes([]);
        }}
      >
        <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>Done</Text>
      </Pressable>

      {feedback ? (
        <Text style={{ ...theme.typography.body, color: theme.colors.semantic.stateSuccess }}>{feedback}</Text>
      ) : null}
    </View>
  );
}
