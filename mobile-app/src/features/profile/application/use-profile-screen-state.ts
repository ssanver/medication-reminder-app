import { useEffect, useMemo, useState } from 'react';
import { getLocaleTag, getTranslations, type Locale } from '../../localization/localization';
import { resolveProfileAvatarEmoji } from '../profile-avatar';
import { loadProfile, saveProfile } from '../profile-store';
import { formatProfileDate, parseProfileDate } from './profile-screen-model';

type UseProfileScreenStateInput = {
  locale: Locale;
};

export function useProfileScreenState({ locale }: UseProfileScreenStateInput) {
  const t = getTranslations(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [draftBirthDate, setDraftBirthDate] = useState(new Date());
  const avatarEmoji = resolveProfileAvatarEmoji(gender, locale);

  useEffect(() => {
    void (async () => {
      const profile = await loadProfile();
      setName(profile.fullName);
      setEmail(profile.email);
      setBirthDate(profile.birthDate);
      setGender(profile.gender);
    })();
  }, []);

  const localizedBirthDate = useMemo(() => {
    if (!birthDate) {
      return t.select;
    }

    const parsed = parseProfileDate(birthDate);
    return parsed.toLocaleDateString(getLocaleTag(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [birthDate, locale]);

  async function save() {
    await saveProfile({
      fullName: name,
      email,
      birthDate,
      gender,
      photoUri: '',
    });
    setSavedMessage(t.profileUpdated);
    setTimeout(() => setSavedMessage(''), 2000);
  }

  function openDateSheet() {
    setDraftBirthDate(parseProfileDate(birthDate));
  }

  function applyDraftBirthDate() {
    setBirthDate(formatProfileDate(draftBirthDate));
  }

  return {
    name,
    setName,
    email,
    setEmail,
    birthDate,
    setBirthDate,
    gender,
    setGender,
    savedMessage,
    draftBirthDate,
    setDraftBirthDate,
    avatarEmoji,
    localizedBirthDate,
    save,
    openDateSheet,
    applyDraftBirthDate,
  };
}
