// Emoji palettes for the coach's editors. Kept separate from avatarOptions so
// each picker offers something relevant instead of one giant grid.

export const meritEmojis = [
  '😊', '⏰', '💪', '🤝', '⭐', '👑', '✨', '📈', '💬', '🔥',
  '🎯', '🏆', '💎', '🚀', '🌈', '🙌', '👏', '💯', '🧠', '❤️',
];

export const demeritEmojis = [
  '🕐', '📋', '😤', '😔', '🗣️', '📱', '👎', '❌', '⚠️', '👗',
  '🚫', '😒', '💤', '🙄', '📵', '🛑', '😬', '🤷', '🧊', '⛔',
];

export const groupEmojis = [
  '🏆', '🤸', '🎀', '🔥', '⚡', '🌟', '💎', '🦋', '🐯', '🦅',
  '🎪', '🎭', '🥇', '🧨', '🌪️', '🎓',
];

export const tierEmojis = [
  '⭐', '🌟', '🏆', '👑', '💎', '🥇', '🚀', '🔥', '🎖️', '🏅',
  '✨', '💫', '🎉', '🦄', '💜', '🌸',
];

// Six-swatch palette for squad groups. Kept in JS (not CSS) so a group's color
// can be stored on the group object and rendered inline.
export const groupColors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Teal', value: '#14b8a6' },
];
