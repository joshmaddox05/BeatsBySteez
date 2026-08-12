import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const medal = (index) => (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`);

const LeaderboardList = ({ cheerleaders, highlightId }) => {
  const sorted = [...cheerleaders].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <View>
      {sorted.map((cheerleader, index) => {
        const isPositive = cheerleader.totalPoints >= 0;
        const isMe = cheerleader.id === highlightId;
        return (
          <View key={cheerleader.id} style={[styles.item, isMe && styles.itemHighlight]}>
            <Text style={styles.rank}>{medal(index)}</Text>
            <Text style={styles.avatar}>{cheerleader.avatar}</Text>
            <Text style={styles.name}>
              {cheerleader.name}
              {isMe ? ' (You)' : ''}
            </Text>
            <Text style={{ color: isPositive ? colors.positiveText : colors.negativeText, fontWeight: '700' }}>
              {isPositive ? '+' : ''}
              {cheerleader.totalPoints} pts
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemHighlight: { borderWidth: 2, borderColor: colors.primary },
  rank: { width: 36, fontWeight: '700', color: colors.textPrimary },
  avatar: { fontSize: 22, marginRight: 8 },
  name: { flex: 1, fontWeight: '600', color: colors.textPrimary },
});

export default LeaderboardList;
