import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TodayScreen } from '../screens/today-screen';
import { MyMedsScreen } from '../screens/my-meds-screen';
import { AddMedsScreen } from '../screens/add-meds-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { theme } from '../theme';

type TabKey = 'today' | 'my-meds' | 'add-meds' | 'settings';

export function AppNavigator() {
  const [activeTab, setActiveTab] = useState<TabKey>('today');

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderTab(activeTab)}</View>
      <View style={styles.tabBar}>
        {renderTabButton('today', 'Today', activeTab, setActiveTab)}
        {renderTabButton('my-meds', 'My Meds', activeTab, setActiveTab)}
        {renderTabButton('add-meds', 'Add Meds', activeTab, setActiveTab)}
        {renderTabButton('settings', 'Settings', activeTab, setActiveTab)}
      </View>
    </View>
  );
}

function renderTab(tab: TabKey) {
  switch (tab) {
    case 'today':
      return <TodayScreen />;
    case 'my-meds':
      return <MyMedsScreen />;
    case 'add-meds':
      return <AddMedsScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <TodayScreen />;
  }
}

function renderTabButton(
  tab: TabKey,
  label: string,
  activeTab: TabKey,
  setActiveTab: (nextTab: TabKey) => void,
) {
  const isActive = tab === activeTab;

  return (
    <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.backgroundDefault,
  },
  content: {
    flex: 1,
    padding: theme.spacing[16],
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.semantic.backgroundDefault,
  },
  tabButton: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...theme.typography.caption,
    color: theme.colors.semantic.textSecondary,
  },
  activeTabLabel: {
    color: theme.colors.semantic.brandPrimary,
    fontWeight: '600',
  },
});
