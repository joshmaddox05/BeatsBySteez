import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import DashboardHeader from '../components/DashboardHeader';
import AnnouncementSection from '../components/AnnouncementSection';
import TeamCalendar from '../components/TeamCalendar';
import { colors } from '../theme/colors';

const AnnouncementsScreen = () => {
  const { userRole } = useApp();
  const isCoach = userRole === 'coach';
  const [view, setView] = useState('feed');

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="📢 Announcements" />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'feed' && styles.toggleBtnActive]}
          onPress={() => setView('feed')}
        >
          <Text style={[styles.toggleText, view === 'feed' && styles.toggleTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'calendar' && styles.toggleBtnActive]}
          onPress={() => setView('calendar')}
        >
          <Text style={[styles.toggleText, view === 'calendar' && styles.toggleTextActive]}>📅 Calendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {view === 'feed' ? <AnnouncementSection isCoach={isCoach} /> : <TeamCalendar isCoach={isCoach} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  toggleRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontWeight: '700', color: colors.textSecondary },
  toggleTextActive: { color: '#fff' },
});

export default AnnouncementsScreen;
