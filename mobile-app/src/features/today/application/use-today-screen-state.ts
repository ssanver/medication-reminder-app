import { useEffect, useMemo, useState } from 'react';
import { getDateTitle, getWeekStrip } from '../../date/week-strip';
import { loadAppDefinitions, type AppDefinitions } from '../../definitions/definitions-service';
import { getLocaleTag, getTranslations, type Locale } from '../../localization/localization';
import { getScheduledDosesForDate } from '../../medications/medication-store';
import { useMedicationStore } from '../../medications/use-medication-store';
import { toShortDisplayName } from '../../profile/display-name';
import { resolveProfileAvatarEmoji } from '../../profile/profile-avatar';
import { loadProfile } from '../../profile/profile-store';

export type TodayDoseFilter = 'All' | 'Taken' | 'Missed';

type UseTodayScreenStateInput = {
  locale: Locale;
  weekStartsOn: 'monday' | 'sunday';
};

export function useTodayScreenState({ locale, weekStartsOn }: UseTodayScreenStateInput) {
  const t = getTranslations(locale);
  const store = useMedicationStore();
  const [filter, setFilter] = useState<TodayDoseFilter>('All');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [showFutureActionPopup, setShowFutureActionPopup] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [doses, setDoses] = useState<Awaited<ReturnType<typeof getScheduledDosesForDate>>>([]);
  const [definitions, setDefinitions] = useState<AppDefinitions | null>(null);

  const shortDisplayName = toShortDisplayName(profileName);
  const avatarEmoji = resolveProfileAvatarEmoji(profileGender, locale);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const scheduled = await getScheduledDosesForDate(selectedDate, locale);
        if (!isMounted) {
          return;
        }
        setDoses(scheduled);
      } catch {
        if (!isMounted) {
          return;
        }
        setDoses([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, locale, store.medications, store.events]);

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return doses;
    }

    const map = {
      Taken: 'taken',
      Missed: 'missed',
    } as const;

    return doses.filter((item) => item.status === map[filter]);
  }, [doses, filter]);

  const counts = useMemo(
    () => ({
      all: doses.length,
      taken: doses.filter((item) => item.status === 'taken').length,
      missed: doses.filter((item) => item.status === 'missed').length,
    }),
    [doses],
  );

  const hasAnyDoseForSelectedDate = doses.length > 0;
  const isTakenFilter = filter === 'Taken';
  const isMissedFilter = filter === 'Missed';
  const showFilteredEmptyWarningOnly = (isMissedFilter || isTakenFilter) && filtered.length === 0 && hasAnyDoseForSelectedDate;
  const filteredEmptyTitle = isMissedFilter ? t.noMissedMedicationTitle : t.noTakenMedicationTitle;

  const dateDelta = useMemo(() => {
    const normalize = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return normalize(selectedDate) - normalize(new Date());
  }, [selectedDate]);

  const isFutureDate = dateDelta > 0;
  const isPastDate = dateDelta < 0;

  useEffect(() => {
    setActionWarning(null);
    setShowFutureActionPopup(false);
  }, [selectedDate, filter]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const loaded = await loadAppDefinitions();
        if (!isMounted) {
          return;
        }
        setDefinitions(loaded);
      } catch {
        if (!isMounted) {
          return;
        }
        setDefinitions(null);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await loadProfile();
        setProfileName(profile.fullName);
        setProfileGender(profile.gender);
        setProfileLoadError(null);
      } catch {
        setProfileName('');
        setProfileGender('');
        setProfileLoadError(t.profileDataMissing);
      }
    })();
  }, [t.profileDataMissing]);

  const weekStrip = useMemo(() => getWeekStrip(selectedDate, locale, weekStartsOn), [selectedDate, locale, weekStartsOn]);
  const dateTitle = useMemo(() => getDateTitle(selectedDate, locale), [selectedDate, locale]);
  const sponsoredAd = useMemo(() => {
    const definition = definitions?.sponsoredAd;
    if (!definition) {
      return null;
    }
    const localized = definition.localized[locale] ?? definition.localized.en ?? Object.values(definition.localized)[0];
    if (!localized || !localized.title || !localized.body || !localized.ctaLabel || !definition.ctaUrl) {
      return null;
    }
    return {
      id: definition.id,
      title: localized.title,
      body: localized.body,
      ctaLabel: localized.ctaLabel,
      ctaUrl: definition.ctaUrl,
    };
  }, [definitions, locale]);
  const sectionTitle = useMemo(() => {
    const localeTag = getLocaleTag(locale);
    const dateText = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long' }).format(selectedDate);
    if (dateDelta === 0) {
      return `${dateText} ${t.todaysMedication}`;
    }
    return t.medicationsForDate.replace('{{date}}', dateText);
  }, [selectedDate, locale, dateDelta, t.todaysMedication]);

  return {
    filter,
    setFilter,
    selectedDate,
    setSelectedDate,
    actionWarning,
    setActionWarning,
    showFutureActionPopup,
    setShowFutureActionPopup,
    shortDisplayName,
    profileLoadError,
    avatarEmoji,
    filtered,
    counts,
    hasAnyDoseForSelectedDate,
    isTakenFilter,
    isMissedFilter,
    showFilteredEmptyWarningOnly,
    filteredEmptyTitle,
    dateDelta,
    isFutureDate,
    isPastDate,
    weekStrip,
    dateTitle,
    sponsoredAd,
    sectionTitle,
  };
}
