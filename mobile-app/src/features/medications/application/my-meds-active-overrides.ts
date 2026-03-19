export type MedicationListItem = {
  id: string;
  name: string;
  details: string;
  schedule: string;
  active: boolean;
  emoji: string;
};

export type MedicationActiveOverrides = Record<string, boolean>;

export function mergeMedicationActiveOverrides(items: MedicationListItem[], overrides: MedicationActiveOverrides): MedicationListItem[] {
  return items.map((item) => ({
    ...item,
    active: overrides[item.id] ?? item.active,
  }));
}

export function pruneResolvedActiveOverrides(
  overrides: MedicationActiveOverrides,
  medications: ReadonlyArray<{ id: string; active: boolean }>,
): MedicationActiveOverrides {
  const next = { ...overrides };
  let changed = false;

  for (const [medicationId, expectedActive] of Object.entries(overrides)) {
    const currentMedication = medications.find((item) => item.id === medicationId);
    if (!currentMedication || currentMedication.active === expectedActive) {
      delete next[medicationId];
      changed = true;
    }
  }

  return changed ? next : overrides;
}
