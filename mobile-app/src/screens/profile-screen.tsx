import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { getLocaleOptions, getTranslations, type Locale } from '../features/localization/localization';
import { TextField } from '../components/ui/text-field';
import { loadProfile, saveProfile } from '../features/profile/profile-store';
import { theme } from '../theme';

type ProfileScreenProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onBack: () => void;
};

export function ProfileScreen({ locale, onLocaleChange, onBack }: ProfileScreenProps) {
  const t = getTranslations(locale);
  const localeOptions = getLocaleOptions(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('1 - October - 1998');
  const [gender, setGender] = useState('Female');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    void (async () => {
      const profile = await loadProfile();
      setName(profile.fullName);
      setEmail(profile.email);
      setBirthDate(profile.birthDate);
      setGender(profile.gender);
    })();
  }, []);

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

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <ScreenHeader title={t.editProfile} leftAction={{ icon: '<', onPress: onBack }} />

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarIcon}>👤</Text></View>
          <Text style={styles.avatarEdit}>⟳</Text>
        </View>

        <View style={styles.card}>
          <TextField label={t.name} value={name} onChangeText={setName} />
          <TextField label={t.email} value={email} onChangeText={setEmail} />
          <TextField label={t.dateOfBirth} value={birthDate} onChangeText={setBirthDate} />
          <TextField label={t.gender} value={gender} onChangeText={setGender} />

          <View style={styles.languageWrap}>
            <Text style={styles.sectionTitle}>{t.language}</Text>
            <Pressable style={styles.languageCombo} onPress={() => setLanguageOpen(true)}>
              <Text style={styles.languageText}>{localeOptions.find((item) => item.code === locale)?.label ?? locale}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          </View>

          {savedMessage ? <Text style={styles.savedText}>{savedMessage}</Text> : null}
          <Button label={t.saveChanges} onPress={() => void onSave()} />
        </View>
      </ScrollView>

      <Modal transparent visible={languageOpen} animationType="slide" onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setLanguageOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{t.selectLanguage}</Text>
            {localeOptions.map((option) => {
              const selected = option.code === locale;
              return (
                <Pressable
                  key={option.code}
                  style={[styles.languageOption, selected && styles.languageOptionActive]}
                  onPress={() => {
                    onLocaleChange(option.code);
                    setLanguageOpen(false);
                  }}
                >
                  <Text style={[styles.languageOptionText, selected && styles.languageOptionTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
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
  avatarEdit: {
    position: 'absolute',
    right: '38%',
    bottom: 0,
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
  sectionTitle: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.semantic.textPrimary,
  },
  languageWrap: {
    gap: theme.spacing[4],
  },
  languageCombo: {
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
  languageText: {
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
  languageOption: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderSoft,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  languageOptionActive: {
    borderColor: theme.colors.primaryBlue[500],
    backgroundColor: theme.colors.primaryBlue[50],
  },
  languageOptionText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  languageOptionTextActive: {
    color: theme.colors.primaryBlue[500],
    fontWeight: '700',
  },
});
