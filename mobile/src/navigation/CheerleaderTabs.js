import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import MyProgressScreen from '../screens/cheerleader/MyProgressScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const icons = { 'My Progress': '📊', Leaderboard: '🏆', Announcements: '📢' };

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
  </Tab.Navigator>
);

export default CheerleaderTabs;
