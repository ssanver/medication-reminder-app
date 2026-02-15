import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/button';
import { ScreenHeader } from '../components/ui/screen-header';
import { getTranslations, type Locale } from '../features/localization/localization';
import { TextField } from '../components/ui/text-field';
import { currentUser } from '../features/profile/current-user';
import { theme } from '../theme';

type ProfileScreenProps = {
  locale: Locale;
  onBack: () => void;
};

export function ProfileScreen({ locale, onBack }: ProfileScreenProps) {
  const t = getTranslations(locale);
  const [name, setName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [birthDate, setBirthDate] = useState('1 - October - 1998');
  const [gender, setGender] = useState('Female');

  return (
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
        <Button label={t.save} onPress={() => undefined} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.accountsCenter}</Text>
        <Pressable style={styles.accountRow}>
          <Text style={styles.accountText}>{`👩 ${currentUser.fullName}`}</Text>
        </Pressable>
        <Pressable style={styles.accountRow}>
          <Text style={styles.accountText}>👵 Mom</Text>
        </Pressable>
        <Pressable style={styles.accountRow}>
          <Text style={styles.addAccount}>{t.addAnotherAccount}</Text>
        </Pressable>
      </View>
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
  accountRow: {
    minHeight: 44,
    borderRadius: theme.radius[8],
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing[16],
    justifyContent: 'center',
  },
  accountText: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textPrimary,
  },
  addAccount: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.primaryBlue[500],
  },
});
