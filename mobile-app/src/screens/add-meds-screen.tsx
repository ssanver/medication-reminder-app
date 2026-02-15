import { Text, View } from 'react-native';
import { theme } from '../theme';

export function AddMedsScreen() {
  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>
        Ilac Ekle
      </Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Wizard adimlari bu ekranda uygulanacak.
      </Text>
    </View>
  );
}
