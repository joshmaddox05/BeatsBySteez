import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const isSameLocalDay = (timestamp, reference) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
};

const CoachStatHeader = ({ cheerleaders, pointHistory, currentSeason }) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Live history is already scoped to the current season on mobile — past
  // seasons are archived into their own subcollection when a season ends.
  const seasonHistory = pointHistory;
  const thisWeek = seasonHistory.filter((h) => new Date(h.timestamp) >= weekAgo);
  const meritsThisWeek = thisWeek.filter((h) => h.isMerit).reduce((sum, h) => sum + (h.points || 0), 0);
  const demeritsThisWeek = thisWeek
    .filter((h) => !h.isMerit)
    .reduce((sum, h) => sum + (h.points || 0), 0);
  const awardsToday = seasonHistory.filter((h) => isSameLocalDay(h.timestamp, now)).length;

  const leader = [...cheerleaders].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0];

  const Tile = ({ value, label, color }) => (
    <View style={styles.tile}>
      <Text style={[styles.value, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Tile value={cheerleaders.length} label="On the squad" />
      <Tile value={`+${meritsThisWeek}`} label="Merits this week" color={colors.positiveText} />
      <Tile value={demeritsThisWeek} label="Demerits this week" color={colors.negativeText} />
      <Tile value={awardsToday} label="Awards today" />
      <Tile
        value={leader ? `${leader.avatar} ${leader.name.split(' ')[0]}` : '—'}
        label={leader ? `Leading with ${leader.totalPoints || 0}` : 'No cheerleaders yet'}
      />
      {!!currentSeason && (
        <Tile value={currentSeason.name} label={`${seasonHistory.length} awards this season`} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 10 },
  tile: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    minWidth: 104,
  },
  value: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  label: { color: colors.textSecondary, fontSize: 11, marginTop: 2, maxWidth: 100 },
});

export default CoachStatHeader;
