import { apiRequestJson, apiRequestVoid } from '../network/api-client';
import { buildUserReferenceQuery } from '../auth/user-reference';

export type ProfileState = {
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
  photoUri: string;
};

export class ProfileDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileDataError';
  }
}

type UserProfileApiResponse = {
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
  photoUri: string;
  updatedAt: string;
};

function fromApi(response: UserProfileApiResponse): ProfileState {
  const fullName = typeof response.fullName === 'string' ? response.fullName.trim() : '';
  const email = typeof response.email === 'string' ? response.email.trim().toLowerCase() : '';
  if (!fullName) {
    throw new ProfileDataError('Profile full name is missing.');
  }
  if (!email) {
    throw new ProfileDataError('Profile email is missing.');
  }

  return {
    fullName,
    email,
    birthDate: typeof response.birthDate === 'string' ? response.birthDate : '',
    gender: typeof response.gender === 'string' ? response.gender : '',
    photoUri: typeof response.photoUri === 'string' ? response.photoUri : '',
  };
}

export async function loadProfile(): Promise<ProfileState> {
  const query = await buildUserReferenceQuery();
  const response = await apiRequestJson<UserProfileApiResponse>(`/api/user-profile${query}`, {
    correlationPrefix: 'user-profile-get',
  });
  return fromApi(response);
}

export async function saveProfile(nextProfile: ProfileState): Promise<void> {
  const query = await buildUserReferenceQuery();
  await apiRequestJson<UserProfileApiResponse>(`/api/user-profile${query}`, {
    method: 'PUT',
    body: {
      fullName: nextProfile.fullName,
      email: nextProfile.email,
      birthDate: nextProfile.birthDate,
      gender: nextProfile.gender,
      photoUri: nextProfile.photoUri,
    },
    correlationPrefix: 'user-profile-put',
  });
}

export async function clearProfile(): Promise<void> {
  const query = await buildUserReferenceQuery();
  await apiRequestVoid(`/api/user-profile${query}`, {
    method: 'DELETE',
    correlationPrefix: 'user-profile-delete',
  });
}
