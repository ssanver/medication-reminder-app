import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../components/ui/app-icon';
import { Button } from '../components/ui/button';
import { MedicationCard } from '../components/ui/medication-card';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getDateTitle, getWeekStrip } from '../features/date/week-strip';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { clearDoseStatus, getScheduledDosesForDate, setDoseStatus } from '../features/medications/medication-store';
import { useMedicationStore } from '../features/medications/use-medication-store';
import { scheduleSnoozeReminder } from '../features/notifications/local-notifications';
import { toShortDisplayName } from '../features/profile/display-name';
import { currentUser } from '../features/profile/current-user';
import { theme } from '../theme';

type TodayScreenProps = {
  locale: Locale;
  fontScale: number;
  remindersEnabled: boolean;
  snoozeMinutes: number;
  showEmailVerificationAlert: boolean;
  onOpenAddMedication: () => void;
  onOpenNotificationHistory: () => void;
  onOpenEmailVerification: () => void;
};

type DoseStatus = 'All' | 'Taken' | 'Missed';

export function TodayScreen({
  locale,
  fontScale,
  remindersEnabled,
  snoozeMinutes,
  showEmailVerificationAlert,
  onOpenAddMedication,
  onOpenNotificationHistory,
  onOpenEmailVerification,
}: TodayScreenProps) {
  const t = getTranslations(locale);
  const store = useMedicationStore();
  const [filter, setFilter] = useState<DoseStatus>('All');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [showFutureActionPopup, setShowFutureActionPopup] = useState(false);
  const shortDisplayName = toShortDisplayName(currentUser.fullName);
  const doses = useMemo(() => getScheduledDosesForDate(selectedDate, locale), [selectedDate, locale, store.medications, store.events]);

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return doses;
    }

    const map = {
      Taken: 'taken',
      Missed: 'missed',
    } as const;

    return doses.filter((item) => item.status === map[filter]);
  }, [filter, doses]);

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
  const filteredEmptyTitle =
    isMissedFilter
      ? t.noMissedMedicationTitle
      : locale === 'tr'
        ? 'Alınan ilacınız bulunmamaktadır'
        : 'No taken medications were found';
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

  const weekStrip = useMemo(() => getWeekStrip(selectedDate, locale), [selectedDate, locale]);
  const dateTitle = useMemo(() => getDateTitle(selectedDate, locale), [selectedDate, locale]);
  const sectionTitle = useMemo(() => {
    const localeTag = getLocaleTag(locale);
    const dateText = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long' }).format(selectedDate);
    return `${dateText} ${t.todaysMedication}`;
  }, [selectedDate, locale]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileRow}>
        <View style={styles.profileLeft}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>👩</Text></View>
          <View>
            <Text style={styles.hello}>{`${t.hello}, ${shortDisplayName}`}</Text>
            <Text style={styles.welcome}>{t.welcome}</Text>
          </View>
        </View>
        <View style={styles.rightIcons}>
          {showEmailVerificationAlert ? (
            <Pressable style={styles.warnButton} onPress={onOpenEmailVerification}>
              <Text style={styles.warnIcon}>!</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.bellButton} onPress={onOpenNotificationHistory}>
            <AppIcon name="alarm" size={18} color={theme.colors.semantic.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.dateTitle, { fontSize: theme.typography.bodyScale.mRegular.fontSize * fontScale }]}>{dateTitle}</Text>
      <View style={styles.calendarStrip}>
        <Pressable onPress={() => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7))}>
          <Text style={styles.arrow}>{'<'}</Text>
        </Pressable>
        {weekStrip.map((day) => {
          return (
            <Pressable
              key={day.key}
              style={[styles.dayCell, day.isSelected && styles.dayCellActive]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text style={[styles.dayText, day.isSelected && styles.dayTextActive]}>{day.label}</Text>
              <Text style={[styles.dayDate, day.isSelected && styles.dayTextActive, day.isToday && styles.dayDateToday]}>{day.dateLabel}</Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7))}>
          <Text style={styles.arrow}>{'>'}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <SegmentedControl
        options={[
          { label: t.all, value: 'All', count: counts.all },
          { label: t.taken, value: 'Taken', count: counts.taken },
          { label: t.missed, value: 'Missed', count: counts.missed },
        ]}
        value={filter}
        onChange={(next) => setFilter(next as DoseStatus)}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>{showFilteredEmptyWarningOnly ? filteredEmptyTitle : t.noMedicationTitle}</Text>
          {!showFilteredEmptyWarningOnly ? <Text style={styles.emptyDescription}>{t.noMedicationDescription}</Text> : null}
          {!showFilteredEmptyWarningOnly ? <Button label={t.addMedication} onPress={onOpenAddMedication} /> : null}
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <MedicationCard
              key={item.id}
              name={item.name}
              details={item.details}
              schedule={item.schedule}
              actionLabel={
                isPastDate
                  ? item.status === 'taken'
                    ? t.markAsMissed
                    : item.status === 'missed'
                      ? t.take
                      : t.markAsTaken
                  : item.status === 'taken'
                    ? t.taken
                    : t.take
              }
              actionVariant={
                isPastDate
                  ? item.status === 'taken'
                    ? 'danger'
                    : 'success'
                  : item.status === 'taken'
                    ? 'success'
                    : item.status === 'missed'
                      ? 'danger'
                      : 'filled'
              }
              statusBadge={item.status === 'missed' ? 'missed' : item.status === 'pending' ? 'ontime' : undefined}
              showAction
              medEmoji={item.emoji}
              onActionPress={() => {
                if (isFutureDate) {
                  setShowFutureActionPopup(true);
                  return;
                }

                if (isPastDate) {
                  if (item.status === 'taken') {
                    void setDoseStatus(item.medicationId, selectedDate, 'missed', item.scheduledTime);
                  } else if (item.status === 'missed') {
                    void clearDoseStatus(item.medicationId, selectedDate, item.scheduledTime);
                  } else {
                    void setDoseStatus(item.medicationId, selectedDate, 'taken', item.scheduledTime);
                  }
                  setActionWarning(null);
                  return;
                }

                void setDoseStatus(item.medicationId, selectedDate, 'taken', item.scheduledTime);
                setActionWarning(null);
              }}
              secondaryActionLabel={
                remindersEnabled && item.status === 'pending' ? t.snoozeInMinutes.replace('15', `${snoozeMinutes}`) : undefined
              }
              onSecondaryActionPress={() => {
                if (!remindersEnabled) {
                  return;
                }

                if (isFutureDate) {
                  setShowFutureActionPopup(true);
                  return;
                }

                void scheduleSnoozeReminder({
                  minutes: snoozeMinutes,
                  medicationName: item.name,
                  localeTitle: t.notificationTitle,
                  localeBodyTemplate: (name, minutes) =>
                    t.notificationBodyTemplate.replace('{{name}}', name).replace('{{minutes}}', `${minutes}`),
                });
              }}
            />
          ))}
        </View>
      )}

      {actionWarning ? <Text style={styles.warning}>{actionWarning}</Text> : null}
      {!remindersEnabled ? <Text style={styles.warning}>{t.notificationPermissionRequired}</Text> : null}
      <View style={styles.bottomSpacer} />
      <Text style={styles.hidden}>{`${t.today}-${selectedDate.getTime()}`}</Text>

      <Modal transparent visible={showFutureActionPopup} animationType="fade" onRequestClose={() => setShowFutureActionPopup(false)}>
        <Pressable style={styles.popupOverlay} onPress={() => setShowFutureActionPopup(false)}>
          <Pressable style={styles.popupCard} onPress={() => undefined}>
            <View style={styles.popupBadge}>
              <Text style={styles.popupBadgeIcon}>!</Text>
            </View>
            <Text style={styles.popupTitle}>{locale === 'tr' ? 'İleri Tarihli İşlem' : 'Future Date Action'}</Text>
            <Text style={styles.popupDescription}>
              {locale === 'tr' ? 'Tarihi gelmeden ilacınızı alamazsınız' : 'You cannot take your medication before its date.'}
            </Text>
            <Button label={locale === 'tr' ? 'Tamam' : 'Okay'} onPress={() => setShowFutureActionPopup(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[16],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  warnButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnIcon: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.error[500],
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryBlue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  hello: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  welcome: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dateTitle: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  calendarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
  },
  arrow: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dayCell: {
    width: 28,
    borderRadius: theme.radius[8],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellActive: {
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  dayText: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dayDate: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  dayTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  dayDateToday: {
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  list: {
    gap: theme.spacing[16],
  },
  emptyCard: {
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderColor: theme.colors.semantic.borderSoft,
    borderWidth: 1,
    padding: theme.spacing[16],
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  emptyDescription: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
  warning: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[500],
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 23, 37, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[24],
  },
  popupCard: {
    borderRadius: theme.radius[24],
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    padding: theme.spacing[24],
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  popupBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.error[50],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupBadgeIcon: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.error[500],
  },
  popupTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  popupDescription: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
});
