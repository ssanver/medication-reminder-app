import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { fontScaleLevels } from '../features/accessibility/accessibility-settings';
import { getTranslations, type Locale } from '../features/localization/localization';
import { theme } from '../theme';

type SettingsScreenProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  fontScale: number;
  onFontScaleChange: (fontScale: number) => void;
  onOpenReports: () => void;
  onOpenProfile: () => void;
};

export function SettingsScreen({ locale, onLocaleChange, fontScale, onFontScaleChange, onOpenReports, onOpenProfile }: SettingsScreenProps) {
  const t = getTranslations(locale);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [medRemindersEnabled, setMedRemindersEnabled] = useState(true);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={t.settings} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarEmoji}>👩</Text></View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Hello, Hanie</Text>
          <Pressable onPress={onOpenProfile}>
            <Text style={styles.editLink}>Edit profile</Text>
          </Pressable>
        </View>
      </View>

      <Section title="Profile">
        <MenuRow label="Accounts Center" value="2 accounts" onPress={onOpenProfile} />
      </Section>

      <Section title="Reminder & Alarm">
        <MenuRow label="Notification settings" value="Default app sound" />
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.rowTitle}>App Notifications</Text>
            <Text style={styles.rowSubtitle}>Open medication reminders</Text>
          </View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.rowTitle}>Medication reminders</Text>
            <Text style={styles.rowSubtitle}>Daily medication schedule alerts</Text>
          </View>
          <Switch value={medRemindersEnabled} onValueChange={setMedRemindersEnabled} />
        </View>
      </Section>

      <Section title="General">
        <MenuRow label="Language" value={locale.toUpperCase()} onPress={() => onLocaleChange(locale === 'tr' ? 'en' : 'tr')} />
        <MenuRow label="Display zoom" value={`${Math.round(fontScale * 100)}%`} />
        <View style={styles.zoomRow}>
          {fontScaleLevels.map((level) => {
            const selected = level === fontScale;
            return (
              <Pressable key={level} onPress={() => onFontScaleChange(level)} style={[styles.zoomChip, selected && styles.zoomChipActive]}>
                <Text style={[styles.zoomText, selected && styles.zoomTextActive]}>{`${Math.round(level * 100)}%`}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Reporting">
        <MenuRow label="Reports" value="Weekly, monthly" onPress={onOpenReports} />
      </Section>

      <Section title="About Us">
        <MenuRow label="App info" value="Version 1.0.2" />
      </Section>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

type MenuRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
};

function MenuRow({ label, value, onPress }: MenuRowProps) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress} disabled={!onPress}>
      <View>
        <Text style={styles.rowTitle}>{label}</Text>
        {value ? <Text style={styles.rowSubtitle}>{value}</Text> : null}
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
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
  profileCard: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    ...theme.elevation.card,
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
  profileInfo: {
    gap: 2,
  },
  profileName: {
    ...theme.typography.bodyScale.mBold,
    color: theme.colors.semantic.textPrimary,
  },
  editLink: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
  },
  sectionWrap: {
    gap: theme.spacing[4],
  },
  sectionTitle: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  group: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    overflow: 'hidden',
    ...theme.elevation.card,
  },
  menuRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRow: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  rowSubtitle: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  chevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  zoomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
    padding: theme.spacing[16],
  },
  zoomChip: {
    minWidth: 64,
    height: 30,
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  zoomChipActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  zoomText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  zoomTextActive: {
    color: theme.colors.primaryBlue[500],
  },
  bottomSpacer: {
    height: theme.spacing[8],
  },
});
