import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💊 💊</Text>
      <Text style={styles.title}>Pill Mind</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primaryBlue[500],
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[16],
  },
  logo: {
    ...theme.typography.display.d2Semibold,
    color: '#FFFFFF',
  },
  title: {
    ...theme.typography.heading.h2Semibold,
    color: '#FFFFFF',
  },
});
