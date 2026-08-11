import React from 'react';
import { useApp } from '../contexts/AppContext';
import TierBadge from './TierBadge';

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
    <div className="tier-progress">
      <div className="tier-progress-top">
        {current ? <TierBadge points={total} /> : <span className="tier-progress-none">No tier yet</span>}
        {next && (
          <span className="tier-progress-label">
            {next.pointsAway} {next.pointsAway === 1 ? 'pt' : 'pts'} to {next.tier.icon} {next.tier.name}
          </span>
        )}
        {!next && <span className="tier-progress-label">Top tier reached! 🎉</span>}
      </div>
      <div className="tier-progress-bar">
        <div className="tier-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default TierProgress;
