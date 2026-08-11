import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import DashboardHeader from '../../components/DashboardHeader';
import RecentActivity from '../../components/RecentActivity';
import { colors } from '../../theme/colors';

const ActivityScreen = () => {
  const { pointHistory, cheerleaders } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="📋 Recent Activity" />
      <ScrollView contentContainerStyle={styles.content}>
        <RecentActivity history={pointHistory} cheerleaders={cheerleaders} limit={50} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
});

export default ActivityScreen;
