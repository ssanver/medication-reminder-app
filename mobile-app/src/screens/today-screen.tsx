import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AppIcon } from '../components/ui/app-icon';
import { Button } from '../components/ui/button';
import { MedicationCard } from '../components/ui/medication-card';
import { SponsoredBanner } from '../components/ui/sponsored-banner';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getTranslations, type Locale } from '../features/localization/localization';
import { clearDoseStatus, setDoseStatus } from '../features/medications/medication-store';
import { scheduleSnoozeReminder } from '../features/notifications/local-notifications';
import { useTodayScreenState, type TodayDoseFilter } from '../features/today/application/use-today-screen-state';
import { theme } from '../theme';

type TodayScreenProps = {
  locale: Locale;
  fontScale: number;
  weekStartsOn: 'monday' | 'sunday';
  remindersEnabled: boolean;
  snoozeMinutes: number;
  isGuestMode: boolean;
  showEmailVerificationAlert: boolean;
  onOpenAddMedication: () => void;
  onOpenSignUp: () => void;
  onOpenNotificationHistory: () => void;
  onOpenEmailVerification: () => void;
};

export function TodayScreen({
  locale,
  fontScale,
  weekStartsOn,
  remindersEnabled,
  snoozeMinutes,
  isGuestMode,
  showEmailVerificationAlert,
  onOpenAddMedication,
  onOpenSignUp,
  onOpenNotificationHistory,
  onOpenEmailVerification,
}: TodayScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const t = getTranslations(locale);
  const {
    filter,
    setFilter,
    selectedDate,
    setSelectedDate,
    actionWarning,
    setActionWarning,
    showFutureActionPopup,
    setShowFutureActionPopup,
    shortDisplayName,
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
    weekStrip: _weekStrip,
    dateTitle,
    sponsoredAd,
    sectionTitle,
  } = useTodayScreenState({ locale, weekStartsOn });
  const dayStripRef = useRef<ScrollView>(null);
  const dayAnchorRef = useRef(new Date());
  const DAY_ITEM_WIDTH = 44;
  const DAY_ITEM_GAP = theme.spacing[4];
  const DAY_ITEM_SNAP = DAY_ITEM_WIDTH + DAY_ITEM_GAP;
  const DAY_ARROW_BUTTON_WIDTH = 44;
  const DAY_RANGE = 365;
  const dayStripSidePadding = Math.max(theme.spacing[8], (windowWidth - DAY_ARROW_BUTTON_WIDTH * 2 - DAY_ITEM_WIDTH) / 2);
  const dayStripItems = useMemo(() => {
    const anchor = dayAnchorRef.current;
    const anchorDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    return Array.from({ length: DAY_RANGE * 2 + 1 }, (_, idx) => {
      const diff = idx - DAY_RANGE;
      const date = new Date(anchorDate);
      date.setDate(anchorDate.getDate() + diff);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        date,
        label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', '').slice(0, 1).toUpperCase(),
        dateLabel: `${date.getDate()}`,
        isToday: new Date().toDateString() === date.toDateString(),
      };
    });
  }, [locale]);
  const selectedIndex = useMemo(() => {
    const anchor = dayAnchorRef.current;
    const anchorDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const diffDays = Math.round((current.getTime() - anchorDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(dayStripItems.length - 1, DAY_RANGE + diffDays));
  }, [dayStripItems.length, selectedDate]);

  useEffect(() => {
    dayStripRef.current?.scrollTo({
      x: selectedIndex * DAY_ITEM_SNAP,
      animated: true,
    });
  }, [selectedIndex, DAY_ITEM_SNAP]);

  function selectDayFromOffset(offsetX: number) {
    const index = Math.max(0, Math.min(dayStripItems.length - 1, Math.round(offsetX / DAY_ITEM_SNAP)));
    const target = dayStripItems[index];
    if (!target) {
      return;
    }
    setSelectedDate(target.date);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>💊</Text>
        </View>
        <Text style={styles.brandTitle}>Pill Mind</Text>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.profileLeft}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>{avatarEmoji}</Text></View>
          {isGuestMode ? (
            <Pressable style={styles.guestAlertRow} onPress={onOpenSignUp}>
              <Text style={styles.guestAlertHello}>{`${t.hello},`}</Text>
              <Text style={styles.guestAlertCta}>{t.signUpNow}</Text>
            </Pressable>
          ) : (
            <View>
              <Text style={styles.hello}>{`${t.hello}, ${shortDisplayName}`}</Text>
              <Text style={styles.welcome}>{t.welcome}</Text>
            </View>
          )}
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
      {sponsoredAd ? (
        <SponsoredBanner
          title={sponsoredAd.title}
          body={sponsoredAd.body}
          ctaLabel={sponsoredAd.ctaLabel}
          onPress={() => {
            // Non-blocking ad action. Failures must not block the user flow.
            void (async () => {
              try {
                const supported = await Linking.canOpenURL(sponsoredAd.ctaUrl);
                if (!supported) {
                  return;
                }
                await Linking.openURL(sponsoredAd.ctaUrl);
              } catch {
                // Swallow ad CTA failures.
              }
            })();
          }}
        />
      ) : null}
      <View style={styles.calendarStrip}>
        <Pressable
          style={styles.calendarArrowButton}
          hitSlop={14}
          onPress={() => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))}
        >
          <AppIcon name="back" size={20} color={theme.colors.semantic.textSecondary} />
        </Pressable>
        <ScrollView
          ref={dayStripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={DAY_ITEM_SNAP}
          decelerationRate="fast"
          contentContainerStyle={[styles.calendarStripContent, { paddingHorizontal: dayStripSidePadding }]}
          onMomentumScrollEnd={(event) => selectDayFromOffset(event.nativeEvent.contentOffset.x)}
        >
          {dayStripItems.map((day, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Pressable
                key={day.key}
                style={[styles.dayCell, { width: DAY_ITEM_WIDTH, height: DAY_ITEM_WIDTH }, isSelected && styles.dayCellActive]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{day.label}</Text>
                <Text style={[styles.dayDate, isSelected && styles.dayTextActive, day.isToday && styles.dayDateToday]}>{day.dateLabel}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          style={styles.calendarArrowButton}
          hitSlop={14}
          onPress={() => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))}
        >
          <AppIcon name="forward" size={20} color={theme.colors.semantic.textSecondary} />
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
        onChange={(next) => setFilter(next as TodayDoseFilter)}
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
              locale={locale}
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
            <Text style={styles.popupTitle}>{t.futureDateActionTitle}</Text>
            <Text style={styles.popupDescription}>{t.futureDateActionDescription}</Text>
            <Button label={t.okay} onPress={() => setShowFutureActionPopup(false)} />
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: theme.spacing[8],
    paddingTop: theme.spacing[4],
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryBlue[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  brandTitle: {
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
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
  guestAlertRow: {
    minHeight: 36,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    backgroundColor: theme.colors.error[50],
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  guestAlertHello: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.error[800],
  },
  guestAlertCta: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.error[800],
    fontWeight: '700',
  },
  dateTitle: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  calendarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.semantic.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[4],
    minHeight: 72,
  },
  calendarArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarStripContent: {
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  dayCell: {
    width: 52,
    height: 52,
    borderRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
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
