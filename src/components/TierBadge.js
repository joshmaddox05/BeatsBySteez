import React from 'react';
import { useApp } from '../contexts/AppContext';

// Renders the highest reward tier a point total has reached. Renders nothing
// when no tier is reached, or when the coach has configured no tiers at all.
const TierBadge = ({ points, size = 'md' }) => {
  const { getTierForPoints } = useApp();
  const tier = getTierForPoints(points);

  if (!tier) return null;

  return (
    <span className={`tier-badge ${size}`} title={`${tier.threshold}+ points`}>
      <span className="tier-badge-icon">{tier.icon}</span>
      <span className="tier-badge-name">{tier.name}</span>
    </span>
  );
};

export default TierBadge;
