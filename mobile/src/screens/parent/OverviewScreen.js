import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import DashboardHeader from '../../components/DashboardHeader';
import RecentActivity from '../../components/RecentActivity';
import { colors } from '../../theme/colors';

const OverviewScreen = () => {
  const { currentUser, cheerleaders, getCheerleaderHistory } = useApp();
  const childId = currentUser?.childId;
  const childData = cheerleaders.find((c) => c.id === childId);
  const childHistory = getCheerleaderHistory(childId || '');

  const totalMerits = childHistory.filter((h) => h.isMerit).reduce((sum, h) => sum + h.points, 0);
  const totalDemerits = childHistory.filter((h) => !h.isMerit).reduce((sum, h) => sum + h.points, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyChange = childHistory.filter((h) => new Date(h.timestamp) >= weekAgo).reduce((sum, h) => sum + h.points, 0);

  const sorted = [...cheerleaders].sort((a, b) => b.totalPoints - a.totalPoints);
  const childRank = sorted.findIndex((c) => c.id === childId) + 1;

  if (!childData) {
    return (
      <SafeAreaView style={styles.safe}>
        <DashboardHeader title="Overview" />
        <Text style={styles.notFound}>Could not find your child's profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="Overview" subtitle="Parent Portal" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroAvatar}>{childData.avatar}</Text>
          <Text style={styles.heroName}>{childData.name}'s Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{childData.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{childRank}</Text>
              <Text style={styles.statLabel}>Squad Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: weeklyChange >= 0 ? colors.positiveText : colors.negativeText }}>
                {weeklyChange >= 0 ? '+' : ''}
                {weeklyChange}
              </Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.positiveBg }]}>
            <Text style={styles.statCardTitle}>Total Merits</Text>
            <Text style={[styles.statCardValue, { color: colors.positiveText }]}>+{totalMerits}</Text>
            <Text style={styles.statCardSub}>{childHistory.filter((h) => h.isMerit).length} awards</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.negativeBg }]}>
            <Text style={styles.statCardTitle}>Total Demerits</Text>
            <Text style={[styles.statCardValue, { color: colors.negativeText }]}>{totalDemerits}</Text>
            <Text style={styles.statCardSub}>{childHistory.filter((h) => !h.isMerit).length} records</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <RecentActivity history={childHistory.slice(0, 10)} cheerleaders={cheerleaders} limit={10} />
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
  heroName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 4, marginBottom: 14, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, marginRight: 8 },
  statCardTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  statCardValue: { fontSize: 22, fontWeight: '800' },
  statCardSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
});

export default OverviewScreen;
