import { StyleSheet, View } from 'react-native';
import { theme } from '../../theme';

export function BottomSheetHandle() {
  return <View style={styles.handle} />;
}

const styles = StyleSheet.create({
  handle: {
    width: 64,
    height: 5,
    borderRadius: theme.radius[8],
    backgroundColor: theme.colors.neutral[400],
    alignSelf: 'center',
  },
});
