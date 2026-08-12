import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import DashboardHeader from '../../components/DashboardHeader';
import RecentActivity from '../../components/RecentActivity';
import { colors } from '../../theme/colors';

const HistoryScreen = () => {
  const { currentUser, cheerleaders, getCheerleaderHistory } = useApp();
  const childHistory = getCheerleaderHistory(currentUser?.childId || '');

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="Full History" />
      <ScrollView contentContainerStyle={styles.content}>
        <RecentActivity history={childHistory} cheerleaders={cheerleaders} limit={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
});

export default HistoryScreen;
