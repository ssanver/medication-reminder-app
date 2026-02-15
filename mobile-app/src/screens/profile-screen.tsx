import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui/screen-header';
import { theme } from '../theme';

type ProfileScreenProps = {
  onBack: () => void;
};

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Profil" subtitle="Hesap ve profil bilgileri" leftAction={{ icon: '<', onPress: onBack }} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Hello, Hanie</Text>
          <Text style={styles.subtext}>Edit profile</Text>
        </View>
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.sectionTitle}>Hesaplar</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountText}>Mom</Text>
          <Text style={styles.check}>v</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountText}>Hanie</Text>
          <Text style={styles.accountAction}>Add another account</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[16],
  },
  profileCard: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primaryBlue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 24,
  },
  profileInfo: {
    gap: theme.spacing[4],
  },
  name: {
    ...theme.typography.heading.h6Medium,
    color: theme.colors.semantic.textPrimary,
  },
  subtext: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.primaryBlue[500],
  },
  accountCard: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radius[16],
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[16],
    gap: theme.spacing[8],
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountText: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  check: {
    ...theme.typography.bodyScale.mMedium,
    color: theme.colors.primaryBlue[500],
  },
  accountAction: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
});
