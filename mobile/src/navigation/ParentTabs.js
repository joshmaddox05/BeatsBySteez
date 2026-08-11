import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import OverviewScreen from '../screens/parent/OverviewScreen';
import HistoryScreen from '../screens/parent/HistoryScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import ContactScreen from '../screens/parent/ContactScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const icons = { Overview: '📊', History: '📋', Announcements: '📢', Contact: '✉️' };

const ParentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
    })}
  >
    <Tab.Screen name="Overview" component={OverviewScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
    <Tab.Screen name="Contact" component={ContactScreen} />
  </Tab.Navigator>
);

export default ParentTabs;
