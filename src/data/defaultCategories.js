// Default merit and demerit categories for cheer tracking

export const defaultMeritCategories = [
  { id: 'great-attitude', name: 'Great Attitude', points: 2, icon: '😊' },
  { id: 'on-time', name: 'On Time', points: 1, icon: '⏰' },
  { id: 'worked-hard', name: 'Worked Hard', points: 2, icon: '💪' },
  { id: 'helped-teammate', name: 'Helped Teammate', points: 2, icon: '🤝' },
  { id: 'nailed-routine', name: 'Nailed Routine', points: 3, icon: '⭐' },
  { id: 'showed-leadership', name: 'Showed Leadership', points: 3, icon: '👑' },
  { id: 'positive-energy', name: 'Positive Energy', points: 2, icon: '✨' },
  { id: 'improved-skill', name: 'Improved Skill', points: 2, icon: '📈' },
  { id: 'encouraged-others', name: 'Encouraged Others', points: 2, icon: '💬' },
  { id: 'extra-effort', name: 'Extra Effort', points: 3, icon: '🔥' },
];

export const defaultDemeritCategories = [
  { id: 'late', name: 'Late to Practice', points: -2, icon: '🕐' },
  { id: 'unprepared', name: 'Unprepared', points: -1, icon: '📋' },
  { id: 'disrespectful', name: 'Disrespectful', points: -3, icon: '😤' },
  { id: 'not-trying', name: 'Not Trying', points: -2, icon: '😔' },
  { id: 'talking-back', name: 'Talking Back', points: -2, icon: '🗣️' },
  { id: 'distracted', name: 'Distracted', points: -1, icon: '📱' },
  { id: 'negative-attitude', name: 'Negative Attitude', points: -2, icon: '👎' },
  { id: 'missed-practice', name: 'Missed Practice', points: -3, icon: '❌' },
  { id: 'unsafe-behavior', name: 'Unsafe Behavior', points: -3, icon: '⚠️' },
  { id: 'uniform-violation', name: 'Uniform Violation', points: -1, icon: '👗' },
];

// Sample cheerleaders for demo
export const sampleCheerleaders = [
  { id: '1', name: 'Emma Johnson', avatar: '🎀', parentCode: 'EMMA2024', totalPoints: 15 },
  { id: '2', name: 'Sophia Williams', avatar: '💖', parentCode: 'SOPHIA2024', totalPoints: 22 },
  { id: '3', name: 'Olivia Brown', avatar: '⭐', parentCode: 'OLIVIA2024', totalPoints: 18 },
  { id: '4', name: 'Ava Davis', avatar: '🌟', parentCode: 'AVA2024', totalPoints: 10 },
  { id: '5', name: 'Isabella Martinez', avatar: '💫', parentCode: 'ISABELLA2024', totalPoints: 25 },
];

// Available avatars for selection
export const avatarOptions = ['🎀', '💖', '⭐', '🌟', '💫', '🦋', '🌸', '💜', '🩷', '🎯', '🏆', '💎', '🌺', '🦄', '🎪'];
