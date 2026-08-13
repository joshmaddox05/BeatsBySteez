import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import MyProgressScreen from '../screens/cheerleader/MyProgressScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import MessagesScreen from '../screens/cheerleader/MessagesScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const icons = { 'My Progress': '📊', Leaderboard: '🏆', Announcements: '📢', Messages: '📬' };

const CheerleaderTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
    })}
  >
    <Tab.Screen name="My Progress" component={MyProgressScreen} />
    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
  </Tab.Navigator>
);

export default CheerleaderTabs;
