import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import {
  getNotificationHistorySnapshot,
  hydrateNotificationHistory,
  subscribeNotificationHistory,
  type NotificationHistoryItem,
} from '../features/notifications/notification-history';
import { theme } from '../theme';

type NotificationHistoryScreenProps = {
  locale: Locale;
  onBack: () => void;
};

function actionLabel(item: NotificationHistoryItem, locale: Locale): string {
  const action = item.lastAction;
  if (locale === 'tr') {
    if (action === 'take-now') {
      return 'Alındı';
    }
    if (action === 'skip') {
      return 'Atlandı';
    }
    if (action === 'snooze') {
      return `${item.snoozeMinutes ?? 5} dk ertelendi`;
    }
    if (action === 'open') {
      return 'Açıldı';
    }
    return 'Gösterildi';
  }

  if (action === 'take-now') {
    return 'Taken';
  }
  if (action === 'skip') {
    return 'Skipped';
  }
  if (action === 'snooze') {
    return `Snoozed ${item.snoozeMinutes ?? 5} min`;
  }
  if (action === 'open') {
    return 'Opened';
  }
  return 'Shown';
}

export function NotificationHistoryScreen({ locale, onBack }: NotificationHistoryScreenProps) {
  const t = getTranslations(locale);
  const items = useSyncExternalStore(subscribeNotificationHistory, getNotificationHistorySnapshot, getNotificationHistorySnapshot);

  useEffect(() => {
    void hydrateNotificationHistory();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={locale === 'tr' ? 'Bildirim Geçmişi' : 'Notification History'} leftAction={{ icon: '<', onPress: onBack }} />

      {sortedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{locale === 'tr' ? 'Henüz bildirim geçmişi yok' : 'No notification history yet'}</Text>
          <Text style={styles.emptyDescription}>{t.noDetailsAvailable}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sortedItems.map((item, index) => (
            <View key={item.id} style={[styles.row, index < sortedItems.length - 1 && styles.rowDivider]}>
              <View style={styles.rowMain}>
                <Text style={styles.title}>{item.medicationName}</Text>
                <Text style={styles.subtitle}>{`${item.scheduledTime} • ${item.medicationDetails}`}</Text>
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.action}>{actionLabel(item, locale)}</Text>
                <Text style={styles.time}>{new Date(item.updatedAt).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
  emptyCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  emptyTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  emptyDescription: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  list: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    overflow: 'hidden',
  },
  row: {
    minHeight: 60,
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  title: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  subtitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  action: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[600],
  },
  time: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
});
