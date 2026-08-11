import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import SquadScreen from '../screens/coach/SquadScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ActivityScreen from '../screens/coach/ActivityScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const icons = { Squad: '👥', Leaderboard: '🏆', Activity: '📋', Announcements: '📢' };

const CoachTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
    })}
  >
    <Tab.Screen name="Squad" component={SquadScreen} />
    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Tab.Screen name="Activity" component={ActivityScreen} />
    <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
  </Tab.Navigator>
);

export default CoachTabs;
