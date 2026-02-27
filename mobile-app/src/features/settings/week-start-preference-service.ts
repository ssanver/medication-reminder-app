import { apiRequestJson } from '../network/api-client';

type WeekStartPreferenceApiResponse = {
  userReference: string;
  weekStartsOn: 'monday' | 'sunday';
  updatedAt: string;
};

export async function loadWeekStartPreference(userReference?: string): Promise<'monday' | 'sunday'> {
  const query = userReference ? `?userReference=${encodeURIComponent(userReference)}` : '';
  const response = await apiRequestJson<WeekStartPreferenceApiResponse>(`/api/user-preferences${query}`, {
    correlationPrefix: 'user-preference-get',
  });
  return response.weekStartsOn === 'sunday' ? 'sunday' : 'monday';
}

export async function saveWeekStartPreference(weekStartsOn: 'monday' | 'sunday', userReference?: string): Promise<void> {
  await apiRequestJson<WeekStartPreferenceApiResponse>('/api/user-preferences', {
    method: 'PUT',
    body: {
      userReference,
      weekStartsOn,
    },
    correlationPrefix: 'user-preference-put',
  });
}
