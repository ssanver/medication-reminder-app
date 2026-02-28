import { useMemo, useState } from 'react';
import { getMedicationById, updateMedication } from '../medication-store';

export function useMedicationDetailsScreenState(medicationId: string, savedText: string) {
  const medication = useMemo(() => getMedicationById(medicationId), [medicationId]);
  const [name, setName] = useState(medication?.name ?? '');
  const [dosage, setDosage] = useState(medication?.dosage ?? '1');
  const [frequencyLabel, setFrequencyLabel] = useState(medication?.frequencyLabel ?? 'Every 1 Day');
  const [time, setTime] = useState(medication?.time ?? '09:00');
  const [note, setNote] = useState(medication?.note ?? '');
  const [message, setMessage] = useState('');

  async function save() {
    if (!medication) {
      return false;
    }

    await updateMedication(medicationId, {
      name: name.trim() || medication.name,
      dosage: dosage.trim() || medication.dosage,
      frequencyLabel: frequencyLabel.trim() || medication.frequencyLabel,
      time: time.trim() || medication.time,
      note: note.trim(),
    });
    setMessage(savedText);
    return true;
  }

  return {
    medication,
    name,
    setName,
    dosage,
    setDosage,
    frequencyLabel,
    setFrequencyLabel,
    time,
    setTime,
    note,
    setNote,
    message,
    save,
  };
}
