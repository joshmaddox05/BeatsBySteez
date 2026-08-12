// Reward tiers the coach can rename, retune, or delete entirely.
// A cheerleader "is" the highest tier whose threshold she has reached.
// Always sorted by threshold ascending when read.

export const defaultRewardTiers = [
  { id: 'rising-star', name: 'Rising Star', icon: '⭐', threshold: 25 },
  { id: 'spirit-star', name: 'Spirit Star', icon: '🌟', threshold: 50 },
  { id: 'team-mvp', name: 'Team MVP', icon: '🏆', threshold: 100 },
  { id: 'squad-legend', name: 'Squad Legend', icon: '👑', threshold: 200 },
];
