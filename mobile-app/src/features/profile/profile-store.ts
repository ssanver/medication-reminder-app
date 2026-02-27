import { apiRequestJson } from '../network/api-client';

export type ProfileState = {
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
  photoUri: string;
};

type UserProfileApiResponse = {
  userReference: string;
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
  photoUri: string;
  updatedAt: string;
};

const defaultProfile: ProfileState = {
  fullName: '',
  email: '',
  birthDate: '',
  gender: '',
  photoUri: '',
};

function fromApi(response: UserProfileApiResponse): ProfileState {
  return {
    fullName: typeof response.fullName === 'string' ? response.fullName : defaultProfile.fullName,
    email: typeof response.email === 'string' ? response.email : defaultProfile.email,
    birthDate: typeof response.birthDate === 'string' ? response.birthDate : defaultProfile.birthDate,
    gender: typeof response.gender === 'string' ? response.gender : defaultProfile.gender,
    photoUri: typeof response.photoUri === 'string' ? response.photoUri : defaultProfile.photoUri,
  };
}

export async function loadProfile(): Promise<ProfileState> {
  try {
    const response = await apiRequestJson<UserProfileApiResponse>('/api/user-profile', {
      correlationPrefix: 'user-profile-get',
    });
    return fromApi(response);
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(nextProfile: ProfileState): Promise<void> {
  await apiRequestJson<UserProfileApiResponse>('/api/user-profile', {
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
  await apiRequestJson('/api/user-profile', {
    method: 'DELETE',
    correlationPrefix: 'user-profile-delete',
  });
}
