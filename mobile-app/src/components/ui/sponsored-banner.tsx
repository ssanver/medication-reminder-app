import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type SponsoredBannerProps = {
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
};

export function SponsoredBanner({ title, body, ctaLabel, onPress }: SponsoredBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius[8],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    backgroundColor: '#FFF7E8',
    padding: theme.spacing[8],
    gap: theme.spacing[8],
  },
  badge: {
    ...theme.typography.captionScale.mRegular,
    color: '#8A4A00',
  },
  body: {
    ...theme.typography.bodyScale.xmRegular,
    color: theme.colors.semantic.textPrimary,
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: theme.radius[8],
    backgroundColor: '#FFB74D',
    paddingHorizontal: theme.spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...theme.typography.captionScale.lRegular,
    color: '#3D2200',
    fontWeight: '700',
  },
});
