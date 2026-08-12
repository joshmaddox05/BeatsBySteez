import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

// Renders the highest reward tier a point total has reached. Renders nothing
// when no tier is reached, or when the coach has configured no tiers at all.
const TierBadge = ({ points, size = 'md' }) => {
  const { getTierForPoints } = useApp();
  const tier = getTierForPoints(points);

  if (!tier) return null;

  const small = size === 'sm';

  return (
    <View style={[styles.badge, small && styles.badgeSmall]}>
      <Text style={small ? styles.iconSmall : styles.icon}>{tier.icon}</Text>
      <Text style={[styles.name, small && styles.nameSmall]}>{tier.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeSmall: { paddingHorizontal: 8, paddingVertical: 2 },
  icon: { fontSize: 14, marginRight: 4 },
  iconSmall: { fontSize: 11, marginRight: 3 },
  name: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  nameSmall: { fontSize: 10 },
});

export default TierBadge;
