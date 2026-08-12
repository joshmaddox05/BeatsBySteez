import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import TierBadge from './TierBadge';
import { colors } from '../theme/colors';

// Current tier + progress toward the next one. Renders nothing when the coach
// has not set up any reward tiers.
const TierProgress = ({ points }) => {
  const { rewardTiers, getTierForPoints, getNextTier } = useApp();

  if (rewardTiers.length === 0) return null;

  const total = Number(points) || 0;
  const current = getTierForPoints(total);
  const next = getNextTier(total);

  // Fill the bar between the current tier's threshold and the next one, so
  // progress reflects the leg being run rather than distance from zero.
  const floor = current ? current.threshold : 0;
  const ceiling = next ? next.tier.threshold : floor;
  const span = ceiling - floor;
  const percent = next ? Math.max(0, Math.min(100, ((total - floor) / (span || 1)) * 100)) : 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        {current ? <TierBadge points={total} /> : <Text style={styles.none}>No tier yet</Text>}
        <Text style={styles.label}>
          {next
            ? `${next.pointsAway} ${next.pointsAway === 1 ? 'pt' : 'pts'} to ${next.tier.icon} ${next.tier.name}`
            : 'Top tier reached! 🎉'}
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  none: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  label: { color: colors.textSecondary, fontSize: 11, flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  bar: { height: 8, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
});

export default TierProgress;
