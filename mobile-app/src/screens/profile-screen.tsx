import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { TextField } from '../components/ui/text-field';
import { loadProfile, saveProfile } from '../features/profile/profile-store';
import { theme } from '../theme';

type ProfileScreenProps = {
  locale: Locale;
  onBack: () => void;
};

type SheetType = 'none' | 'birth-date' | 'gender';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  if (!value) {
    return new Date();
  }

  return new Date(`${value}T00:00:00`);
}

function shiftMonth(base: Date, delta: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function buildCalendarCells(month: Date): Array<Date | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const mondayStartOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: mondayStartOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getGenderOptions(locale: Locale): string[] {
  if (locale === 'tr') {
    return ['Kadın', 'Erkek', 'Belirtmek istemiyorum'];
  }

  return ['Female', 'Male', 'Prefer not to say'];
}

export function ProfileScreen({ locale, onBack }: ProfileScreenProps) {
  const t = getTranslations(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [sheet, setSheet] = useState<SheetType>('none');
  const [savedMessage, setSavedMessage] = useState('');
  const [draftBirthDate, setDraftBirthDate] = useState(formatDate(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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
      return locale === 'tr' ? 'Seçiniz' : 'Select';
    }

    const parsed = parseDateKey(birthDate);
    return parsed.toLocaleDateString(getLocaleTag(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [birthDate, locale]);

  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const calendarCells = buildCalendarCells(calendarMonth);

  async function onSave() {
    await saveProfile({
      fullName: name,
      email,
      birthDate,
      gender,
    });
    setSavedMessage(t.profileUpdated);
    setTimeout(() => setSavedMessage(''), 2000);
  }

  function openDateSheet() {
    const initialDate = birthDate || formatDate(new Date());
    setDraftBirthDate(initialDate);
    setCalendarMonth(parseDateKey(initialDate));
    setSheet('birth-date');
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <ScreenHeader title={t.editProfile} leftAction={{ icon: '<', onPress: onBack }} />

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarIcon}>👤</Text></View>
          <Pressable
            style={styles.avatarEditButton}
            onPress={() => setSavedMessage(locale === 'tr' ? 'Profil fotoğrafı güncelleme yakında aktif olacak.' : 'Profile photo update will be available soon.')}
          >
            <Text style={styles.avatarEditIcon}>📷</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <TextField label={t.name} value={name} onChangeText={setName} />
          <TextField label={t.email} value={email} onChangeText={setEmail} />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t.dateOfBirth}</Text>
            <Pressable style={styles.combo} onPress={openDateSheet}>
              <Text style={styles.comboText}>{localizedBirthDate}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t.gender}</Text>
            <Pressable style={styles.combo} onPress={() => setSheet('gender')}>
              <Text style={styles.comboText}>{gender || (locale === 'tr' ? 'Seçiniz' : 'Select')}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          </View>

          {savedMessage ? <Text style={styles.savedText}>{savedMessage}</Text> : null}
          <Button label={t.saveChanges} onPress={() => void onSave()} />
        </View>
      </ScrollView>

      <Modal transparent visible={sheet !== 'none'} animationType="slide" onRequestClose={() => setSheet('none')}>
        <Pressable style={styles.overlay} onPress={() => setSheet('none')}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {sheet === 'gender' ? (
              <>
                <Text style={styles.sheetTitle}>{t.gender}</Text>
                {getGenderOptions(locale).map((option) => {
                  const selected = option === gender;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionRow, selected && styles.optionRowActive]}
                      onPress={() => {
                        setGender(option);
                        setSheet('none');
                      }}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </>
            ) : null}

            {sheet === 'birth-date' ? (
              <>
                <View style={styles.calendarHeader}>
                  <Text style={styles.sheetTitle}>{t.selectDate}</Text>
                </View>

                <View style={styles.monthHeader}>
                  <Pressable onPress={() => setCalendarMonth((prev) => shiftMonth(prev, -1))} hitSlop={8}>
                    <Text style={styles.monthArrow}>‹</Text>
                  </Pressable>
                  <Text style={styles.monthTitle}>{calendarMonth.toLocaleDateString(getLocaleTag(locale), { month: 'short', year: 'numeric' })}</Text>
                  <Pressable onPress={() => setCalendarMonth((prev) => shiftMonth(prev, 1))} hitSlop={8}>
                    <Text style={styles.monthArrow}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.dayHeaderRow}>
                  {dayHeaders.map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.dayHeaderText}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarCells.map((dateCell, index) => {
                    if (!dateCell) {
                      return <View key={`empty-${index}`} style={styles.calendarCell} />;
                    }

                    const dateKey = formatDate(dateCell);
                    const selected = dateKey === draftBirthDate;

                    return (
                      <Pressable key={dateKey} style={[styles.calendarCell, selected && styles.calendarCellSelected]} onPress={() => setDraftBirthDate(dateKey)}>
                        <Text style={[styles.calendarCellText, selected && styles.calendarCellTextSelected]}>{dateCell.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Button
                  label={t.save}
                  onPress={() => {
                    setBirthDate(draftBirthDate);
                    setSheet('none');
                  }}
                />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.semantic.screenBackground,
  },
  content: {
    gap: theme.spacing[16],
    paddingBottom: theme.spacing[24],
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryBlue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 30,
  },
  avatarEditButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.semantic.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: '36%',
    bottom: 0,
  },
  avatarEditIcon: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.primaryBlue[500],
  },
  card: {
    borderRadius: theme.radius[16],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.semantic.cardBackground,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
    ...theme.elevation.card,
  },
  fieldWrap: {
    gap: theme.spacing[4],
  },
  fieldLabel: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textPrimary,
  },
  combo: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comboText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  chevron: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textMuted,
  },
  savedText: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.success[500],
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.semantic.overlay,
  },
  sheet: {
    borderTopLeftRadius: theme.radius[24],
    borderTopRightRadius: theme.radius[24],
    backgroundColor: theme.colors.semantic.cardBackground,
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[16],
    gap: theme.spacing[8],
  },
  sheetTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  optionRow: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  optionRowActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  optionText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
  calendarHeader: {
    minHeight: 28,
    justifyContent: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  monthArrow: {
    ...theme.typography.heading.h6Medium,
    color: theme.colors.semantic.textSecondary,
  },
  monthTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
  },
  dayHeaderText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing[8],
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius[8],
  },
  calendarCellSelected: {
    backgroundColor: theme.colors.primaryBlue[50],
    borderWidth: 1,
    borderColor: theme.colors.primaryBlue[500],
  },
  calendarCellText: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textSecondary,
  },
  calendarCellTextSelected: {
    color: theme.colors.primaryBlue[600],
    fontWeight: '600',
  },
});
