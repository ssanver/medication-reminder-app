import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppIcon } from '../components/ui/app-icon';
import { Button } from '../components/ui/button';
import { MedicationCard } from '../components/ui/medication-card';
import { SponsoredBanner } from '../components/ui/sponsored-banner';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
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

function toDateKey(value: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function normalizeDate(value: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

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
  const isCompactScreen = windowWidth <= 430;
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
    sponsoredAd,
  } = useTodayScreenState({ locale, weekStartsOn });
  const dayStripRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(normalizeDate(selectedDate));
  const [hasDateSelectionChanged, setHasDateSelectionChanged] = useState(false);
  const [dayAnchorDate, setDayAnchorDate] = useState<Date>(normalizeDate(selectedDate));
  const DAY_ITEM_WIDTH = isCompactScreen ? 38 : 44;
  const DAY_ITEM_GAP = isCompactScreen ? theme.spacing[4] : theme.spacing[8];
  const DAY_ITEM_SNAP = DAY_ITEM_WIDTH + DAY_ITEM_GAP;
  const DAY_ARROW_BUTTON_WIDTH = isCompactScreen ? 36 : 44;
  const DAY_RANGE = 365;
  const dayStripSidePadding = isCompactScreen
    ? 0
    : Math.max(theme.spacing[8], (windowWidth - DAY_ARROW_BUTTON_WIDTH * 2 - DAY_ITEM_WIDTH) / 2);
  const dayStripItems = useMemo(() => {
    const anchorDate = normalizeDate(dayAnchorDate);
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
  }, [locale, dayAnchorDate]);
  const selectedIndex = useMemo(() => {
    const anchorDate = normalizeDate(dayAnchorDate);
    const current = normalizeDate(selectedDate);
    const diffDays = Math.round((current.getTime() - anchorDate.getTime()) / (24 * 60 * 60 * 1000));
    if (!Number.isFinite(diffDays)) {
      return DAY_RANGE;
    }
    return Math.max(0, Math.min(dayStripItems.length - 1, DAY_RANGE + diffDays));
  }, [dayStripItems.length, selectedDate, dayAnchorDate]);
  const selectedDateKey = useMemo(() => toDateKey(normalizeDate(selectedDate)), [selectedDate]);
  const monthYearMedicationsTitle = useMemo(() => {
    const fullDate = new Intl.DateTimeFormat(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(normalizeDate(selectedDate));
    return `${fullDate} Medications`;
  }, [locale, selectedDate]);
  const todayDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const isTodaySelected = selectedDateKey === toDateKey(todayDate);
  const hasSelectedDayInStrip = useMemo(
    () => dayStripItems.some((day) => toDateKey(day.date) === selectedDateKey),
    [dayStripItems, selectedDateKey],
  );

  useEffect(() => {
    const now = new Date();
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }, [setSelectedDate]);

  useEffect(() => {
    isProgrammaticScrollRef.current = true;
    dayStripRef.current?.scrollTo({
      x: selectedIndex * DAY_ITEM_SNAP,
      animated: true,
    });
  }, [selectedIndex, DAY_ITEM_SNAP]);

  useEffect(() => {
    setDraftDate(normalizeDate(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (hasSelectedDayInStrip) {
      return;
    }
    setDayAnchorDate(normalizeDate(selectedDate));
  }, [hasSelectedDayInStrip, selectedDate]);

  function selectDayFromOffset(offsetX: number) {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }
    // `snapToInterval` uses content offset directly; rounding by snap interval keeps backward/forward selection stable.
    const index = Math.max(0, Math.min(dayStripItems.length - 1, Math.round(offsetX / DAY_ITEM_SNAP)));
    const target = dayStripItems[index];
    if (!target) {
      return;
    }
    setSelectedDate(target.date);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.brandHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>💊</Text>
          </View>
          <Text style={styles.brandTitle}>Pill Mind</Text>
        </View>
        <View style={styles.brandRightIcons}>
          {showEmailVerificationAlert ? (
            <Pressable style={styles.warnButton} onPress={onOpenEmailVerification}>
              <Text style={styles.warnIcon}>!</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.bellButton} onPress={onOpenNotificationHistory}>
            <AppIcon name="alarm" size={22} color={theme.colors.semantic.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.profileLeft}>
          {isGuestMode ? (
            <View style={styles.guestProfileCard}>
              <View style={styles.avatar}><Text style={styles.avatarEmoji}>{avatarEmoji}</Text></View>
              <Text style={styles.guestCardWarningText}>{t.guestProfileWarning}</Text>
              <Pressable style={styles.guestCardCta} onPress={onOpenSignUp}>
                <Text style={styles.guestCardCtaText}>{t.signUpNow}</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={styles.hello}>{`${t.hello}, ${shortDisplayName}`}</Text>
              <Text style={styles.welcome}>{t.welcome}</Text>
            </View>
          )}
        </View>
      </View>

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
      <View style={[styles.dateTitleRow, isCompactScreen && styles.dateTitleRowCompact]}>
        <Text
          numberOfLines={isCompactScreen ? 2 : 1}
          style={[
            styles.dateTitle,
            isCompactScreen && styles.dateTitleCompact,
            {
              fontSize: theme.typography.bodyScale.mRegular.fontSize * fontScale * (isCompactScreen ? 0.93 : 1),
              lineHeight: theme.typography.bodyScale.mRegular.fontSize * fontScale * (isCompactScreen ? 1.2 : 1.3),
            },
          ]}
        >
          {monthYearMedicationsTitle}
        </Text>
        <View style={[styles.dateActionsRow, isCompactScreen && styles.dateActionsRowCompact]}>
          <Pressable
            style={[styles.dateFilterButton, isCompactScreen && styles.dateFilterButtonCompact]}
            accessibilityRole="button"
            accessibilityLabel={t.selectDate}
            onPress={() => {
              setDraftDate(normalizeDate(selectedDate));
              setHasDateSelectionChanged(false);
              setDateFilterVisible(true);
            }}
          >
            <AppIcon name="calendar" size={18} color={theme.colors.primaryBlue[700]} />
          </Pressable>
          <Pressable
            style={[styles.todayButton, isCompactScreen && styles.todayButtonCompact, isTodaySelected && styles.todayButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={t.today}
            onPress={() => setSelectedDate(todayDate)}
          >
            <AppIcon name="today" size={18} color={isTodaySelected ? '#FFFFFF' : theme.colors.primaryBlue[700]} />
          </Pressable>
        </View>
      </View>
      <View style={[styles.calendarStrip, isCompactScreen && styles.calendarStripCompact]}>
        <Pressable
          style={[styles.calendarArrowButton, isCompactScreen && styles.calendarArrowButtonCompact]}
          hitSlop={18}
          onPress={() =>
            setSelectedDate((prev) => {
              const safePrev = normalizeDate(prev);
              return new Date(safePrev.getFullYear(), safePrev.getMonth(), safePrev.getDate() - 1);
            })
          }
        >
          <AppIcon name="back" size={24} color={theme.colors.semantic.textSecondary} />
        </Pressable>
        <ScrollView
          ref={dayStripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={DAY_ITEM_SNAP}
          decelerationRate="normal"
          disableIntervalMomentum
          contentContainerStyle={[styles.calendarStripContent, { paddingHorizontal: dayStripSidePadding }]}
          onScrollEndDrag={(event) => selectDayFromOffset(event.nativeEvent.contentOffset.x)}
          onMomentumScrollEnd={(event) => selectDayFromOffset(event.nativeEvent.contentOffset.x)}
        >
          {dayStripItems.map((day, index) => {
            const isSelected = toDateKey(day.date) === selectedDateKey;
            return (
              <Pressable
                key={day.key}
                style={[
                  styles.dayCell,
                  { width: DAY_ITEM_WIDTH, height: DAY_ITEM_WIDTH },
                  isSelected && styles.dayCellActive,
                  isCompactScreen && isSelected && styles.dayCellActiveCompact,
                  !isSelected && day.isToday && styles.dayCellTodayOutline,
                ]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isCompactScreen && styles.dayTextCompact,
                    isSelected && styles.dayTextActive,
                    day.isToday && styles.dayTextToday,
                  ]}
                >
                  {day.label}
                </Text>
                <Text
                  style={[
                    styles.dayDate,
                    isCompactScreen && styles.dayDateCompact,
                    isSelected && styles.dayTextActive,
                    day.isToday && styles.dayDateToday,
                  ]}
                >
                  {day.dateLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          style={[styles.calendarArrowButton, isCompactScreen && styles.calendarArrowButtonCompact]}
          hitSlop={18}
          onPress={() =>
            setSelectedDate((prev) => {
              const safePrev = normalizeDate(prev);
              return new Date(safePrev.getFullYear(), safePrev.getMonth(), safePrev.getDate() + 1);
            })
          }
        >
          <AppIcon name="forward" size={24} color={theme.colors.semantic.textSecondary} />
        </Pressable>
      </View>

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

      <Modal transparent visible={dateFilterVisible} animationType="slide" onRequestClose={() => setDateFilterVisible(false)}>
        <Pressable style={styles.popupOverlay} onPress={() => undefined}>
          <Pressable style={styles.dateFilterSheet} onPress={() => undefined}>
            <Text style={styles.dateFilterTitle}>{t.selectDate}</Text>
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale={getLocaleTag(locale)}
                onChange={(_, date) => {
                  if (!date) {
                    return;
                  }
                  setDraftDate(normalizeDate(date));
                  setHasDateSelectionChanged(true);
                }}
              />
            </View>
            <View style={styles.dateFilterActions}>
              <Button label={t.cancel} variant="outlined" size="s" fullWidth={false} onPress={() => setDateFilterVisible(false)} />
              <Button
                label={t.save}
                size="s"
                fullWidth={false}
                onPress={() => {
                  setSelectedDate(normalizeDate(draftDate));
                  setDateFilterVisible(false);
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  brandHeader: {
    position: 'relative',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: theme.spacing[8],
    paddingTop: theme.spacing[4],
  },
  brandRightIcons: {
    position: 'absolute',
    right: 0,
    top: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
  },
  profileLeft: {
    flex: 1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  guestProfileCard: {
    minHeight: 56,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  guestCardWarningText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
    flex: 1,
  },
  guestCardCta: {
    minHeight: 34,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.error[400],
    backgroundColor: theme.colors.error[50],
    paddingHorizontal: theme.spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCardCtaText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.error[700],
    fontWeight: '700',
  },
  dateTitle: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[8],
    flexWrap: 'wrap',
  },
  dateTitleRowCompact: {
    alignItems: 'flex-start',
  },
  dateTitleCompact: {
    width: '100%',
  },
  dateActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    marginLeft: 'auto',
  },
  dateActionsRowCompact: {
    width: '100%',
    marginLeft: 0,
    justifyContent: 'flex-end',
  },
  dateFilterButton: {
    minHeight: 40,
    minWidth: 50,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[300],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterButtonCompact: {
    minHeight: 36,
    borderRadius: theme.radius[14],
    minWidth: 46,
    paddingHorizontal: theme.spacing[10],
  },
  dateFilterButtonText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.primaryBlue[700],
    fontWeight: '700',
  },
  todayButton: {
    minHeight: 40,
    minWidth: 50,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[300],
    backgroundColor: theme.colors.primaryBlue[50],
    paddingHorizontal: theme.spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonCompact: {
    minHeight: 36,
    borderRadius: theme.radius[14],
    minWidth: 46,
    paddingHorizontal: theme.spacing[10],
  },
  todayButtonActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[500],
  },
  todayButtonText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.primaryBlue[700],
    fontWeight: '600',
  },
  todayButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  calendarStripCompact: {
    paddingHorizontal: 0,
  },
  calendarArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarArrowButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderWidth: 2,
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  dayCellActiveCompact: {
    borderWidth: 2.5,
    borderRadius: 14,
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: '#E9F1FF',
  },
  dayCellTodayOutline: {
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[300],
    backgroundColor: '#FFFFFF',
  },
  dayText: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  dayTextCompact: {
    fontSize: theme.typography.captionScale.mRegular.fontSize - 1,
    lineHeight: theme.typography.captionScale.mRegular.lineHeight - 1,
  },
  dayTextToday: {
    color: theme.colors.semantic.textPrimary,
    fontWeight: '700',
  },
  dayDate: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  dayDateCompact: {
    fontSize: theme.typography.captionScale.lRegular.fontSize - 1,
    lineHeight: theme.typography.captionScale.lRegular.lineHeight - 1,
  },
  dayTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  dayDateToday: {
    textDecorationLine: 'underline',
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
  dateFilterSheet: {
    borderRadius: theme.radius[24],
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    padding: theme.spacing[16],
    gap: theme.spacing[12],
  },
  dateFilterTitle: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  datePickerWrap: {
    alignItems: 'center',
  },
  dateFilterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing[8],
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
});
