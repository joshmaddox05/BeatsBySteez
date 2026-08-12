import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const RecentActivity = ({ history, cheerleaders, limit = 20 }) => {
  const { removePointEntry, userRole } = useApp();

  const getCheerleader = (id) => {
    const cheerleader = cheerleaders.find((c) => c.id === id);
    return cheerleader ? { name: cheerleader.name, avatar: cheerleader.avatar } : { name: 'Unknown', avatar: '❓' };
  };

  const displayHistory = history.slice(0, limit);

  if (displayHistory.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No activity yet. Start awarding merits and demerits!</Text>
      </View>
    );
  }

  return (
    <View>
      {displayHistory.map((entry) => {
        const cheerleader = getCheerleader(entry.cheerleaderId);
        return (
          <View key={entry.id} style={styles.item}>
            <Text style={styles.avatar}>{cheerleader.avatar}</Text>
            <View style={styles.details}>
              <Text>
                <Text style={styles.name}>{cheerleader.name}</Text>{' '}
                <Text style={styles.action}>{entry.isMerit ? 'earned' : 'received'}</Text>{' '}
                <Text style={styles.category}>
                  {entry.category.icon} {entry.category.name}
                </Text>
              </Text>
              {!!entry.note && <Text style={styles.note}>"{entry.note}"</Text>}
              <Text style={styles.meta}>
                {formatDate(entry.timestamp)} · by {entry.awardedBy}
              </Text>
            </View>
            <Text style={{ color: entry.points > 0 ? colors.positiveText : colors.negativeText, fontWeight: '700' }}>
              {entry.points > 0 ? '+' : ''}
              {entry.points}
            </Text>
            {userRole === 'coach' && (
              <TouchableOpacity style={styles.undoBtn} onPress={() => removePointEntry(entry.id)}>
                <Text style={styles.undoBtnText}>↩</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { fontSize: 24, marginRight: 10 },
  details: { flex: 1 },
  name: { fontWeight: '700', color: colors.textPrimary },
  action: { color: colors.textSecondary },
  category: { color: colors.textPrimary },
  note: { color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  undoBtn: { marginLeft: 8, padding: 4 },
  undoBtnText: { fontSize: 16, color: colors.textSecondary },
});

export default RecentActivity;
