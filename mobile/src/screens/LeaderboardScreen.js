import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import DashboardHeader from '../components/DashboardHeader';
import LeaderboardList from '../components/LeaderboardList';
import { colors } from '../theme/colors';

const LeaderboardScreen = () => {
  const { cheerleaders, currentUser } = useApp();
  const highlightId = currentUser?.cheerleaderId;

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="🏆 Leaderboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <LeaderboardList cheerleaders={cheerleaders} highlightId={highlightId} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
});

export default LeaderboardScreen;
