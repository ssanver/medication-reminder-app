import { type ReactNode, useMemo, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MedicationCard } from '../components/ui/medication-card';
import { SegmentedControl } from '../components/ui/segmented-control';
import { getTranslations, type Locale } from '../features/localization/localization';
import { useMyMedsScreenState } from '../features/medications/application/use-my-meds-screen-state';
import { theme } from '../theme';

type MyMedsScreenProps = {
  locale: Locale;
  fontScale: number;
  onOpenMedicationDetails: (medicationId: string) => void;
  onOpenAddMedication: () => void;
};

type MedStatus = 'All' | 'Active' | 'Inactive';

export function MyMedsScreen({ locale, fontScale, onOpenMedicationDetails, onOpenAddMedication }: MyMedsScreenProps) {
  const t = getTranslations(locale);
  const { filter, setFilter, filtered, counts, removeMedication, toggleMedicationActive } = useMyMedsScreenState({ locale });

  function confirmDelete(medicationId: string) {
    Alert.alert(
      locale === 'tr' ? 'İlacı sil' : 'Delete medication',
      locale === 'tr' ? 'Bu işlem geri alınamaz. Devam edilsin mi?' : 'This action cannot be undone. Continue?',
      [
        {
          text: locale === 'tr' ? 'Vazgeç' : 'Cancel',
          style: 'cancel',
        },
        {
          text: locale === 'tr' ? 'Onayla' : 'Confirm',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const errorText = await removeMedication(medicationId);
              if (errorText) {
                Alert.alert(
                  locale === 'tr' ? 'Silme başarısız' : 'Delete failed',
                  errorText,
                );
              }
            })();
          },
        },
      ],
    );
  }

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

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>{locale === 'tr' ? 'İlacınız bulunmamaktadır.' : 'No medications found.'}</Text>
          <Pressable style={styles.emptyButton} onPress={onOpenAddMedication}>
            <Text style={styles.emptyButtonText}>{t.addMedication}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <SwipeToDeleteRow key={item.id} locale={locale} onDelete={() => confirmDelete(item.id)}>
              <MedicationCard
                name={item.name}
                details={item.details}
                schedule={item.schedule}
                active={item.active}
                showToggle
                compact
                medEmoji={item.emoji}
                onToggle={(value) => void toggleMedicationActive(item.id, value)}
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
  locale: Locale;
  onDelete: () => void;
  children: ReactNode;
};

function SwipeToDeleteRow({ locale, onDelete, children }: SwipeToDeleteRowProps) {
  const actionWidth = 96;
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useState(() => new Animated.Value(0))[0];

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 16,
        onPanResponderMove: (_, gesture) => {
          const base = isOpen ? -actionWidth : 0;
          const next = Math.max(-actionWidth, Math.min(0, base + gesture.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const base = isOpen ? -actionWidth : 0;
          const next = Math.max(-actionWidth, Math.min(0, base + gesture.dx));
          const shouldOpen = next < -actionWidth * 0.45 || gesture.vx < -0.35;
          Animated.spring(translateX, {
            toValue: shouldOpen ? -actionWidth : 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start(() => setIsOpen(shouldOpen));
        },
      }),
    [actionWidth, isOpen, translateX],
  );

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeDeleteAction}>
        <Pressable style={styles.swipeDeleteButton} onPress={onDelete}>
          <Text style={styles.swipeDeleteButtonText}>{locale === 'tr' ? 'Sil' : 'Delete'}</Text>
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
  },
  swipeDeleteAction: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  swipeDeleteButton: {
    width: 96,
    height: '100%',
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDeleteButtonText: {
    ...theme.typography.bodyScale.xmMedium,
    color: '#FFFFFF',
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
