import { Text, View } from 'react-native';
import { theme } from '../theme';

export function TodayScreen() {
  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>
        Bugun
      </Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Ilac hatirlatmalari burada listelenecek.
      </Text>
    </View>
  );
}
