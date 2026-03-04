import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../components/ui/app-icon';
import { InlineAdCard } from '../components/ui/inline-ad-card';
import { MedicationCard } from '../components/ui/medication-card';
import { SegmentedControl } from '../components/ui/segmented-control';
import { loadAppDefinitions } from '../features/definitions/definitions-service';
import { getTranslations, type Locale } from '../features/localization/localization';
import { getMonetizationStatus, refreshMonetizationStatus, subscribeMonetizationStatus } from '../features/monetization/subscription-service';
import { useMyMedsScreenState } from '../features/medications/application/use-my-meds-screen-state';
import { theme } from '../theme';
import * as Linking from 'expo-linking';

type MyMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  onOpenMedicationDetails: (medicationId: string) => void;
  onOpenAddMedication: () => void;
};

type MedStatus = 'All' | 'Active' | 'Inactive';

export function MyMedsScreen({ locale, fontScale, onOpenMedicationDetails, onOpenAddMedication }: MyMedsScreenProps) {
  const t = getTranslations(locale);
  const { filter, setFilter, filtered, counts, toggleMedicationActive } = useMyMedsScreenState({ locale });
  const [ad, setAd] = useState<{ title: string; body: string; ctaLabel: string; ctaUrl: string } | null>(null);
  const [adsEnabled, setAdsEnabled] = useState(true);
  function applyMedicationActiveState(medicationId: string, nextActive: boolean) {
    setFilter(nextActive ? 'Active' : 'Inactive');
    void toggleMedicationActive(medicationId, nextActive);
  }

  useEffect(() => {
    const unsubscribe = subscribeMonetizationStatus((status) => setAdsEnabled(status.adsEnabled));
    void (async () => {
      const status = await getMonetizationStatus();
      setAdsEnabled(status.adsEnabled);
      await refreshMonetizationStatus();
      try {
        const definitions = await loadAppDefinitions();
        const sponsored = definitions.sponsoredAd;
        if (!sponsored) {
          setAd(null);
          return;
        }
        if (sponsored.placements && sponsored.placements.length > 0 && !sponsored.placements.includes('my-meds')) {
          setAd(null);
          return;
        }

        const localized = sponsored.localized[locale] ?? sponsored.localized.en ?? Object.values(sponsored.localized)[0];
        if (!localized?.title || !localized.body || !localized.ctaLabel || !sponsored.ctaUrl) {
          setAd(null);
          return;
        }

        setAd({
          title: localized.title,
          body: localized.body,
          ctaLabel: localized.ctaLabel,
          ctaUrl: sponsored.ctaUrl,
        });
      } catch {
        setAd(null);
      }
    })();

    return unsubscribe;
  }, [locale]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { fontSize: theme.typography.heading.h4Medium.fontSize * fontScale }]}>{t.myMedicationTitle}</Text>

      <SegmentedControl
        options={[
          { label: t.all, value: 'All', count: counts.all },
          { label: t.active, value: 'Active', count: counts.active },
          { label: t.inactive, value: 'Inactive', count: counts.inactive },
        ]}
        value={filter}
        onChange={(next) => setFilter(next as MedStatus)}
      />

      {adsEnabled && ad ? (
        <InlineAdCard
          title={ad.title}
          body={ad.body}
          ctaLabel={ad.ctaLabel}
          onPress={() => {
            void Linking.openURL(ad.ctaUrl);
          }}
        />
      ) : null}

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>{t.noMedicationsFound}</Text>
          <Pressable style={styles.emptyButton} onPress={onOpenAddMedication}>
            <Text style={styles.emptyButtonText}>{t.addMedication}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <SwipeToDeleteRow
              key={item.id}
              actionLabel={item.active ? t.makeInactive : t.makeActive}
              actionVariant={item.active ? 'deactivate' : 'activate'}
              onAction={() => applyMedicationActiveState(item.id, !item.active)}
            >
              <MedicationCard
                locale={locale}
                name={item.name}
                details={item.details}
                schedule={item.schedule}
                active={item.active}
                showToggle
                compact
                medEmoji={item.emoji}
                onToggle={(value) => applyMedicationActiveState(item.id, value)}
                onPress={() => onOpenMedicationDetails(item.id)}
              />
            </SwipeToDeleteRow>
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

type SwipeToDeleteRowProps = {
  actionLabel: string;
  actionVariant: 'activate' | 'deactivate';
  onAction: () => void;
  children: ReactNode;
};

function SwipeToDeleteRow({ actionLabel, actionVariant, onAction, children }: SwipeToDeleteRowProps) {
  const actionWidth = 132;
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useState(() => new Animated.Value(0))[0];
  const actionButtonColor = actionVariant === 'deactivate' ? theme.colors.error[500] : theme.colors.success[500];
  const actionIconName = actionVariant === 'deactivate' ? 'close' : 'check';

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 2 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.8,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 &&
          Math.abs(gesture.dy) < 32 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.8,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          const base = isOpen ? -actionWidth : 0;
          const next = Math.max(-actionWidth, Math.min(0, base + gesture.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const base = isOpen ? -actionWidth : 0;
          const next = Math.max(-actionWidth, Math.min(0, base + gesture.dx));
          const shouldOpen = next < -actionWidth * 0.3 || gesture.vx < -0.22;
          Animated.spring(translateX, {
            toValue: shouldOpen ? -actionWidth : 0,
            bounciness: 0,
            speed: 20,
            useNativeDriver: true,
          }).start(() => setIsOpen(shouldOpen));
        },
      }),
    [actionWidth, isOpen, translateX],
  );

  return (
    <View style={styles.swipeContainer}>
      <View style={[styles.swipeDeleteAction, { width: actionWidth }]}>
        <Pressable style={[styles.swipeDeleteButton, { backgroundColor: actionButtonColor }]} onPress={onAction} hitSlop={12}>
          <AppIcon name={actionIconName} size={18} color="#FFFFFF" />
          <Text style={styles.swipeDeleteButtonText}>{actionLabel}</Text>
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingTop: theme.spacing[8],
    paddingBottom: theme.spacing[16],
  },
  title: {
    ...theme.typography.heading.h5Semibold,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  list: {
    gap: theme.spacing[16],
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: theme.radius[16],
    overflow: 'hidden',
  },
  swipeDeleteAction: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 0,
  },
  swipeDeleteButton: {
    width: 132,
    minHeight: 68,
    borderTopRightRadius: theme.radius[16],
    borderBottomRightRadius: theme.radius[16],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  swipeDeleteButtonText: {
    ...theme.typography.captionScale.lRegular,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  emptyCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  emptyIcon: {
    fontSize: 20,
  },
  emptyTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
    textAlign: 'center',
  },
  emptyButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing[16],
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.primaryBlue[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    ...theme.typography.bodyScale.mMedium,
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
