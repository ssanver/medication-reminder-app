import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { getLocaleTag, getTranslations, type Locale } from '../features/localization/localization';
import { TextField } from '../components/ui/text-field';
import { useProfileScreenState } from '../features/profile/application/use-profile-screen-state';
import { getProfileGenderOptions } from '../features/profile/application/profile-screen-model';
import { theme } from '../theme';

type ProfileScreenProps = {
  locale: Locale;
  onBack: () => void;
};

type SheetType = 'none' | 'birth-date' | 'gender';

export function ProfileScreen({ locale, onBack }: ProfileScreenProps) {
  const t = getTranslations(locale);
  const [sheet, setSheet] = useState<SheetType>('none');
  const {
    name,
    setName,
    email,
    setEmail,
    gender,
    setGender,
    savedMessage,
    draftBirthDate,
    setDraftBirthDate,
    avatarEmoji,
    localizedBirthDate,
    save,
    openDateSheet,
    applyDraftBirthDate,
  } = useProfileScreenState({ locale });

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <ScreenHeader title={t.editProfile} leftAction={{ icon: 'back', onPress: onBack }} />

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>{avatarEmoji}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <TextField label={t.name} value={name} onChangeText={setName} />
          <TextField label={t.email} value={email} onChangeText={setEmail} />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t.dateOfBirth}</Text>
            <Pressable
              style={styles.combo}
              onPress={() => {
                openDateSheet();
                setSheet('birth-date');
              }}
            >
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
          <Button label={t.saveChanges} onPress={() => void save()} />
        </View>
      </ScrollView>

      <Modal transparent visible={sheet !== 'none'} animationType="slide" onRequestClose={() => setSheet('none')}>
        <Pressable style={styles.overlay} onPress={() => setSheet('none')}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {sheet === 'gender' ? (
              <>
                <Text style={styles.sheetTitle}>{t.gender}</Text>
                {getProfileGenderOptions(locale).map((option) => {
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
                <Text style={styles.sheetTitle}>{t.selectDate}</Text>
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={draftBirthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    locale={getLocaleTag(locale)}
                    maximumDate={new Date()}
                    style={styles.datePicker}
                    onChange={(_, date) => {
                      if (date) {
                        setDraftBirthDate(date);
                      }
                    }}
                  />
                </View>

                <Button
                  label={t.save}
                  onPress={() => {
                    applyDraftBirthDate();
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
  datePickerWrap: {
    marginBottom: theme.spacing[8],
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    minHeight: 320,
  },
});
