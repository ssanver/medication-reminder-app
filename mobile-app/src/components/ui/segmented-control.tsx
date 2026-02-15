import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type SegmentedControlProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.item, selected && styles.selected]}>
            <Text style={[styles.text, selected && styles.selectedText]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing[8],
    marginBottom: theme.spacing[16],
  },
  item: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.radius[8],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  selected: {
    borderColor: theme.colors.semantic.brandPrimary,
    backgroundColor: theme.colors.primaryBlue[50],
  },
  text: {
    ...theme.typography.captionScale.lRegular,
    color: theme.colors.semantic.textSecondary,
  },
  selectedText: {
    color: theme.colors.semantic.brandPrimary,
    fontWeight: '600',
  },
});
