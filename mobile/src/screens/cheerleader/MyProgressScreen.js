import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import DashboardHeader from '../../components/DashboardHeader';
import RecentActivity from '../../components/RecentActivity';
import TierProgress from '../../components/TierProgress';
import { colors } from '../../theme/colors';

const MyProgressScreen = () => {
  const { currentUser, cheerleaders, getCheerleaderHistory } = useApp();
  const myId = currentUser?.cheerleaderId;
  const myData = cheerleaders.find((c) => c.id === myId);
  const myHistory = getCheerleaderHistory(myId || '');

  const totalMerits = myHistory.filter((h) => h.isMerit).reduce((sum, h) => sum + h.points, 0);
  const totalDemerits = myHistory.filter((h) => !h.isMerit).reduce((sum, h) => sum + h.points, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekHistory = myHistory.filter((h) => new Date(h.timestamp) >= weekAgo);
  const weeklyChange = thisWeekHistory.reduce((sum, h) => sum + h.points, 0);

  const sorted = [...cheerleaders].sort((a, b) => b.totalPoints - a.totalPoints);
  const myRank = sorted.findIndex((c) => c.id === myId) + 1;

  if (!myData) {
    return (
      <SafeAreaView style={styles.safe}>
        <DashboardHeader title="My Progress" />
        <Text style={styles.notFound}>Could not find your profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="My Progress" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroAvatar}>{myData.avatar}</Text>
          <Text style={styles.heroName}>{myData.name}</Text>
          <TierProgress points={myData.totalPoints} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myData.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{myRank}</Text>
              <Text style={styles.statLabel}>Squad Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.positiveText }]}>+{totalMerits}</Text>
              <Text style={styles.statLabel}>Merits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.negativeText }]}>{totalDemerits}</Text>
              <Text style={styles.statLabel}>Demerits</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <Text style={styles.cardText}>{thisWeekHistory.length} point actions this week</Text>
          <Text style={styles.cardText}>
            Points change:{' '}
            <Text style={{ color: weeklyChange >= 0 ? colors.positiveText : colors.negativeText, fontWeight: '700' }}>
              {weeklyChange >= 0 ? '+' : ''}
              {weeklyChange}
            </Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Activity History</Text>
          <RecentActivity history={myHistory} cheerleaders={cheerleaders} limit={20} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  notFound: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  hero: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  heroAvatar: { fontSize: 56 },
  heroName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 4, marginBottom: 14 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center', width: '48%', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  cardText: { color: colors.textPrimary, marginBottom: 4 },
});

export default MyProgressScreen;
