// Groups every squad starts with. The coach can rename, recolor, or delete them
// like any other group — these are just a head start, not fixed levels.
//
// Ids are stable slugs so the level-to-group migration can find them.
export const defaultGroups = [
  { id: 'group-freshman', name: 'Freshman', icon: '🌱', color: '#10b981' },
  { id: 'group-jv', name: 'JV', icon: '⭐', color: '#6366f1' },
  { id: 'group-varsity', name: 'Varsity', icon: '🏆', color: '#ec4899' },
];

export const buildDefaultGroups = () => {
  const createdAt = new Date().toISOString();
  return defaultGroups.map(g => ({ ...g, createdAt }));
};
