import type { Locale } from '../localization/localization';

function normalizeGender(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveProfileAvatarEmoji(gender: string, _locale: Locale): string {
  const normalized = normalizeGender(gender);

  if (normalized === 'male' || normalized === 'erkek') {
    return '👨';
  }

  if (normalized === 'female' || normalized === 'kadın' || normalized === 'kadin') {
    return '👩';
  }

  return '👤';
}
