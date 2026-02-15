import { useEffect, useSyncExternalStore } from 'react';
import { getMedicationStoreSnapshot, hydrateMedicationStore, subscribeMedicationStore } from './medication-store';

export function useMedicationStore() {
  const snapshot = useSyncExternalStore(subscribeMedicationStore, getMedicationStoreSnapshot, getMedicationStoreSnapshot);

  useEffect(() => {
    void hydrateMedicationStore();
  }, []);

  return snapshot;
}

