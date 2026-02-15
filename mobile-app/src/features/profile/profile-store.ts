import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileState = {
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
};

const STORAGE_KEY = 'profile-state-v1';

const defaultProfile: ProfileState = {
  fullName: 'Suleyman Şanver',
  email: 'suleymansanver@gmail.com',
  birthDate: '1 - October - 1998',
  gender: 'Female',
};

export async function loadProfile(): Promise<ProfileState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProfile;
    }

    const parsed = JSON.parse(raw) as Partial<ProfileState>;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : defaultProfile.fullName,
      email: typeof parsed.email === 'string' ? parsed.email : defaultProfile.email,
      birthDate: typeof parsed.birthDate === 'string' ? parsed.birthDate : defaultProfile.birthDate,
      gender: typeof parsed.gender === 'string' ? parsed.gender : defaultProfile.gender,
    };
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(nextProfile: ProfileState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
}

