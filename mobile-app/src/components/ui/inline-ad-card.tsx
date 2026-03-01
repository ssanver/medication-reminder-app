import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type InlineAdCardProps = {
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
};

export function InlineAdCard({ title, body, ctaLabel, onPress }: InlineAdCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable style={styles.ctaButton} onPress={onPress}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius[12],
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
    backgroundColor: '#FFF8E8',
    padding: theme.spacing[12],
    gap: theme.spacing[6],
  },
  badge: {
    ...theme.typography.captionScale.mRegular,
    color: '#7A5B00',
  },
  body: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: theme.radius[12],
    backgroundColor: '#F6B500',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[12],
  },
  ctaText: {
    ...theme.typography.captionScale.lRegular,
    color: '#2B2100',
    fontWeight: '700',
  },
});
