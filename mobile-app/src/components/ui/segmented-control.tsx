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
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECF3',
    padding: theme.spacing[8],
    gap: theme.spacing[8],
    marginBottom: theme.spacing[16],
  },
  item: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[8],
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
    color: '#2C2C2C',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  selectedCountPill: {
    backgroundColor: theme.colors.primaryBlue[800],
    paddingHorizontal: 4,
  },
  countText: {
    ...theme.typography.captionScale.mRegular,
    color: '#7A7A7A',
  },
  selectedCountText: {
    color: '#FFFFFF',
  },
});
