import { Text, View } from 'react-native';
import { theme } from '../theme';

export function SettingsScreen() {
  return (
    <View>
      <Text style={{ ...theme.typography.heading5, color: theme.colors.semantic.textPrimary }}>
        Ayarlar
      </Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.semantic.textSecondary }}>
        Dil, bildirim ve erisilebilirlik ayarlari bu ekranda yonetilecek.
      </Text>
    </View>
  );
}
