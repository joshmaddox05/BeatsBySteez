import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import DashboardHeader from '../components/DashboardHeader';
import AnnouncementSection from '../components/AnnouncementSection';
import { colors } from '../theme/colors';

const AnnouncementsScreen = () => {
  const { userRole } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="📢 Announcements" />
      <ScrollView contentContainerStyle={styles.content}>
        <AnnouncementSection isCoach={userRole === 'coach'} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
});

export default AnnouncementsScreen;
