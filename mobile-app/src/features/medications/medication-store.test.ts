import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addMedication,
  clearDoseStatus,
  clearMedicationStore,
  getMedicationStoreSnapshot,
  setDoseStatus,
  setMedicationActive,
} from './medication-store';

const { loadAccessTokenMock, apiRequestJsonMock } = vi.hoisted(() => ({
  loadAccessTokenMock: vi.fn<() => Promise<string | null>>(),
  apiRequestJsonMock: vi.fn(),
}));

vi.mock('../auth/auth-session-store', () => ({
  loadAccessToken: loadAccessTokenMock,
}));

vi.mock('../network/api-client', () => ({
  apiRequestJson: apiRequestJsonMock,
  apiRequestVoid: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

describe('medication-store/setMedicationActive', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    loadAccessTokenMock.mockResolvedValue(null);
    await clearMedicationStore();
    await addMedication({
      name: 'Lipanthyl',
      form: 'pill',
      intervalUnit: 'day',
      intervalCount: 1,
      dosage: '1',
      isBeforeMeal: true,
      note: '',
      active: true,
    });
  });

  it('oturum acikken ilaci backend cevabi gelmeden pasiflestirmez', async () => {
    loadAccessTokenMock.mockResolvedValue('token');
    apiRequestJsonMock.mockImplementation(() => new Promise<null>(() => undefined));

    const medicationId = getMedicationStoreSnapshot().medications[0]?.id;
    expect(medicationId).toBeTruthy();

    void setMedicationActive(medicationId!, false);

    await vi.waitFor(() => {
      expect(apiRequestJsonMock).toHaveBeenCalledTimes(1);
      expect(getMedicationStoreSnapshot().medications[0]?.active).toBe(true);
    });
  });

  it('backend hatasinda aktiflik durumunu geri alir', async () => {
    loadAccessTokenMock.mockResolvedValue('token');
    apiRequestJsonMock.mockRejectedValue(new Error('network error'));

    const medicationId = getMedicationStoreSnapshot().medications[0]?.id;
    expect(medicationId).toBeTruthy();

    await expect(setMedicationActive(medicationId!, false)).rejects.toThrow('network error');
    expect(getMedicationStoreSnapshot().medications[0]?.active).toBe(true);
  });

  it('backend basarili oldugunda ilaci tekrar aktif hale getiren ek refresh yapmaz', async () => {
    loadAccessTokenMock.mockResolvedValue('token');
    apiRequestJsonMock.mockResolvedValue({
      id: getMedicationStoreSnapshot().medications[0]?.id,
      name: 'Lipanthyl',
      dosage: '1',
      usageType: 'pill',
      isBeforeMeal: true,
      startDate: '2026-03-19',
      endDate: null,
      isActive: false,
      schedules: [
        {
          repeatType: 'daily',
          intervalCount: 1,
          reminderTime: '09:00:00',
          daysOfWeek: null,
        },
      ],
    });

    const medicationId = getMedicationStoreSnapshot().medications[0]?.id;
    expect(medicationId).toBeTruthy();

    await setMedicationActive(medicationId!, false);

    expect(apiRequestJsonMock).toHaveBeenCalledTimes(1);
    expect(getMedicationStoreSnapshot().medications[0]?.active).toBe(false);
  });

  it('backend stale active degeri dondurse bile hedef pasif durumu korur', async () => {
    loadAccessTokenMock.mockResolvedValue('token');
    apiRequestJsonMock
      .mockResolvedValueOnce({
        id: getMedicationStoreSnapshot().medications[0]?.id,
        name: 'Lipanthyl',
        dosage: '1',
        usageType: 'pill',
        isBeforeMeal: true,
        startDate: '2026-03-19',
        endDate: null,
        isActive: true,
        schedules: [
          {
            repeatType: 'daily',
            intervalCount: 1,
            reminderTime: '09:00:00',
            daysOfWeek: null,
          },
        ],
      })
      .mockResolvedValueOnce([
        {
          id: getMedicationStoreSnapshot().medications[0]?.id,
          name: 'Lipanthyl',
          dosage: '1',
          usageType: 'pill',
          isBeforeMeal: true,
          startDate: '2026-03-19',
          endDate: null,
          isActive: false,
          schedules: [
            {
              repeatType: 'daily',
              intervalCount: 1,
              reminderTime: '09:00:00',
              daysOfWeek: null,
            },
          ],
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const medicationId = getMedicationStoreSnapshot().medications[0]?.id;
    expect(medicationId).toBeTruthy();

    await setMedicationActive(medicationId!, false);

    expect(getMedicationStoreSnapshot().medications[0]?.active).toBe(false);
  });

  it('oturum acikken ilac alma durumunu backend cevabi gelmeden degistirmez', async () => {
    loadAccessTokenMock.mockResolvedValue('token');
    apiRequestJsonMock.mockImplementation(() => new Promise<null>(() => undefined));

    const medicationId = getMedicationStoreSnapshot().medications[0]?.id;
    expect(medicationId).toBeTruthy();

    void setDoseStatus(medicationId!, new Date('2026-03-19T09:00:00'), 'taken', '09:00');

    await vi.waitFor(() => {
      expect(apiRequestJsonMock).toHaveBeenCalledTimes(1);
      expect(getMedicationStoreSnapshot().events).toHaveLength(0);
    });
  });

  it('oturum acikken ilac geri alma durumunu backend cevabi gelmeden temizlemez', async () => {
    const medicationId = getMedicationStoreSnapshot().medications[0]?.id;
    expect(medicationId).toBeTruthy();

    await setDoseStatus(medicationId!, new Date('2026-03-19T09:00:00'), 'taken', '09:00');
    expect(getMedicationStoreSnapshot().events).toHaveLength(1);

    loadAccessTokenMock.mockResolvedValue('token');
    apiRequestJsonMock.mockImplementation(() => new Promise<null>(() => undefined));

    void clearDoseStatus(medicationId!, new Date('2026-03-19T09:00:00'), '09:00');

    await vi.waitFor(() => {
      expect(apiRequestJsonMock).toHaveBeenCalledTimes(1);
      expect(getMedicationStoreSnapshot().events).toHaveLength(1);
    });
  });
});
