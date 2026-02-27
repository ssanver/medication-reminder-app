import { apiRequestJson } from '../network/api-client';
import { buildUserReferenceQuery } from '../auth/user-reference';

type WeekStartPreferenceApiResponse = {
  weekStartsOn: 'monday' | 'sunday';
  updatedAt: string;
};

export async function loadWeekStartPreference(): Promise<'monday' | 'sunday'> {
  const query = await buildUserReferenceQuery();
  const response = await apiRequestJson<WeekStartPreferenceApiResponse>(`/api/user-preferences${query}`, {
    correlationPrefix: 'user-preference-get',
  });
  return response.weekStartsOn === 'sunday' ? 'sunday' : 'monday';
}

export async function saveWeekStartPreference(weekStartsOn: 'monday' | 'sunday'): Promise<void> {
  const query = await buildUserReferenceQuery();
  await apiRequestJson<WeekStartPreferenceApiResponse>(`/api/user-preferences${query}`, {
    method: 'PUT',
    body: {
      weekStartsOn,
    },
    correlationPrefix: 'user-preference-put',
  });
}
