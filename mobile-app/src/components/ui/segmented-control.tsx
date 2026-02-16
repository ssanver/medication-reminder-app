import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppFontScale } from '../../features/accessibility/app-font-scale';
import { theme } from '../../theme';

type SegmentOption = string | { label: string; value: string; count?: number };

type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
};

function normalizeOption(option: SegmentOption) {
  if (typeof option === 'string') {
    return { label: option, value: option, count: undefined };
  }

  return option;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const fontScale = useAppFontScale();
  return (
    <View style={styles.container}>
      {options.map((raw, index) => {
        const option = normalizeOption(raw);
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.item, selected && styles.selected, index === 0 && styles.first]}
          >
            <Text style={[styles.text, { fontSize: theme.typography.bodyScale.xmMedium.fontSize * fontScale }, selected && styles.selectedText]}>
              {option.label}
            </Text>
            {option.count !== undefined ? (
              <View style={[styles.countPill, selected && styles.selectedCountPill]}>
                <Text
                  style={[styles.countText, { fontSize: theme.typography.captionScale.mRegular.fontSize * fontScale }, selected && styles.selectedCountText]}
                >
                  {option.count}
                </Text>
              </View>
            ) : null}
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
    minHeight: 36,
    borderRadius: theme.radius[16],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  first: {
    marginLeft: 0,
  },
  selected: {
    backgroundColor: theme.colors.primaryBlue[500],
    borderColor: theme.colors.primaryBlue[500],
  },
  text: {
    ...theme.typography.bodyScale.xmMedium,
    color: theme.colors.semantic.textSecondary,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countPill: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  selectedCountPill: {
    backgroundColor: theme.colors.primaryBlue[800],
  },
  countText: {
    ...theme.typography.captionScale.mRegular,
    color: theme.colors.semantic.textPrimary,
  },
  selectedCountText: {
    color: '#FFFFFF',
  },
});
