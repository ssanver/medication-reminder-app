import { Text, View } from 'react-native';
import { theme } from '../theme';

export function MyMedsScreen() {
  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>
        Ilaclarim
      </Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Aktif ve pasif ilac kartlari bu ekranda olacak.
      </Text>
    </View>
  );
}
