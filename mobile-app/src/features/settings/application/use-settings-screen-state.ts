import { useEffect, useMemo, useState } from 'react';
import Constants from 'expo-constants';
import type { Locale } from '../../localization/localization';
import { toShortDisplayName } from '../../profile/display-name';
import { resolveProfileAvatarEmoji } from '../../profile/profile-avatar';
import { loadProfile } from '../../profile/profile-store';

type UseSettingsScreenStateInput = {
  locale: Locale;
  fontScale: number;
};

export function useSettingsScreenState({ locale, fontScale }: UseSettingsScreenStateInput) {
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [cancelAccountVisible, setCancelAccountVisible] = useState(false);
  const [cancelPassword, setCancelPassword] = useState('');
  const [cancelErrorText, setCancelErrorText] = useState('');
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [draftLocale, setDraftLocale] = useState<Locale>(locale);
  const [draftFontScale, setDraftFontScale] = useState(fontScale);

  useEffect(() => {
    setDraftLocale(locale);
  }, [locale]);

  useEffect(() => {
    setDraftFontScale(fontScale);
  }, [fontScale]);

  useEffect(() => {
    void (async () => {
      const profile = await loadProfile();
      setProfileName(profile.fullName);
      setProfileGender(profile.gender);
    })();
  }, []);

  const shortDisplayName = toShortDisplayName(profileName) || (locale === 'tr' ? 'Kullanıcı' : 'User');
  const profileAvatarEmoji = resolveProfileAvatarEmoji(profileGender, locale);
  const isAppearanceDirty = draftLocale !== locale || draftFontScale !== fontScale;

  const version = useMemo(() => {
    const expoVersion = Constants.expoConfig?.version ?? '1.0.0';
    const iosBuild = Constants.expoConfig?.ios?.buildNumber;
    const androidBuild = Constants.expoConfig?.android?.versionCode;
    const buildMeta = iosBuild ?? (typeof androidBuild === 'number' ? `${androidBuild}` : 'dev');
    return `Version ${expoVersion} (${buildMeta})`;
  }, []);

  return {
    languagePickerOpen,
    setLanguagePickerOpen,
    logoutConfirmVisible,
    setLogoutConfirmVisible,
    cancelAccountVisible,
    setCancelAccountVisible,
    cancelPassword,
    setCancelPassword,
    cancelErrorText,
    setCancelErrorText,
    isCancelLoading,
    setIsCancelLoading,
    draftLocale,
    setDraftLocale,
    draftFontScale,
    setDraftFontScale,
    shortDisplayName,
    profileAvatarEmoji,
    isAppearanceDirty,
    version,
  };
}
