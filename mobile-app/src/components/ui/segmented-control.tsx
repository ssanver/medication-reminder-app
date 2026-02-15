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
      {options.map((option, index) => {
        const selected = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.item, selected && styles.selected, index === 0 && styles.first]}>
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
    borderRadius: theme.radius[16],
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing[4],
    gap: theme.spacing[4],
    marginBottom: theme.spacing[16],
  },
  item: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius[16],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  first: {
    marginLeft: 0,
  },
  selected: {
    backgroundColor: theme.colors.primaryBlue[500],
    borderColor: theme.colors.primaryBlue[500],
  },
  text: {
    ...theme.typography.bodyScale.mRegular,
    color: theme.colors.semantic.textSecondary,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
