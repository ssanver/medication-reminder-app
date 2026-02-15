export type MedicationSummary = {
  name: string;
  dosage: string;
  frequency: string;
  note?: string;
};

export function buildShareSummary(
  medication: MedicationSummary,
  allowedFields: ReadonlyArray<keyof MedicationSummary>,
): Partial<MedicationSummary> {
  const result: Partial<MedicationSummary> = {};

  for (const field of allowedFields) {
    result[field] = medication[field];
  }

  return result;
}
