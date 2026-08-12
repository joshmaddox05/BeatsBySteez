// Default point categories for cheer tracking.
//
// Categories live in a single list. `type` says whether it is a merit or a
// demerit, and `points` is always signed to match (merits positive, demerits
// negative) so a category object can be read on its own without its type.
// `order` controls display order within a type.

export const defaultPointCategories = [
  // Merits
  { id: 'great-attitude', name: 'Great Attitude', points: 5, icon: '😊', type: 'merit', order: 0 },
  { id: 'on-time', name: 'On Time', points: 2, icon: '⏰', type: 'merit', order: 1 },
  { id: 'worked-hard', name: 'Worked Hard', points: 6, icon: '💪', type: 'merit', order: 2 },
  { id: 'helped-teammate', name: 'Helped Teammate', points: 5, icon: '🤝', type: 'merit', order: 3 },
  { id: 'nailed-routine', name: 'Nailed Routine', points: 10, icon: '⭐', type: 'merit', order: 4 },
  { id: 'showed-leadership', name: 'Showed Leadership', points: 8, icon: '👑', type: 'merit', order: 5 },
  { id: 'positive-energy', name: 'Positive Energy', points: 4, icon: '✨', type: 'merit', order: 6 },
  { id: 'improved-skill', name: 'Improved Skill', points: 7, icon: '📈', type: 'merit', order: 7 },
  { id: 'encouraged-others', name: 'Encouraged Others', points: 4, icon: '💬', type: 'merit', order: 8 },
  { id: 'extra-effort', name: 'Extra Effort', points: 8, icon: '🔥', type: 'merit', order: 9 },

  // Demerits
  { id: 'late', name: 'Late to Practice', points: -5, icon: '🕐', type: 'demerit', order: 0 },
  { id: 'unprepared', name: 'Unprepared', points: -3, icon: '📋', type: 'demerit', order: 1 },
  { id: 'disrespectful', name: 'Disrespectful', points: -10, icon: '😤', type: 'demerit', order: 2 },
  { id: 'not-trying', name: 'Not Trying', points: -6, icon: '😔', type: 'demerit', order: 3 },
  { id: 'talking-back', name: 'Talking Back', points: -7, icon: '🗣️', type: 'demerit', order: 4 },
  { id: 'distracted', name: 'Distracted', points: -2, icon: '📱', type: 'demerit', order: 5 },
  { id: 'negative-attitude', name: 'Negative Attitude', points: -5, icon: '👎', type: 'demerit', order: 6 },
  { id: 'missed-practice', name: 'Missed Practice', points: -8, icon: '❌', type: 'demerit', order: 7 },
  { id: 'unsafe-behavior', name: 'Unsafe Behavior', points: -10, icon: '⚠️', type: 'demerit', order: 8 },
  { id: 'uniform-violation', name: 'Uniform Violation', points: -2, icon: '👗', type: 'demerit', order: 9 },
];

// Squad-wide rules the coach can change in Settings.
export const defaultSquadRules = {
  allowNegativeTotals: true,
  dailyPointCap: 0, // 0 = unlimited
  requireNoteOnDemerits: false,
};

// Sample cheerleaders for demo. Totals are derived from sampleHistory below so
// the demo squad's points reconcile with its activity feed.
const sampleRoster = [
  { id: '1', name: 'Emma Johnson', avatar: '🎀', parentCode: 'EMMA2024', position: 'Flyer', groupIds: ['group-varsity'] },
  { id: '2', name: 'Sophia Williams', avatar: '💖', parentCode: 'SOPHIA2024', position: 'Base', groupIds: ['group-varsity'] },
  { id: '3', name: 'Olivia Brown', avatar: '⭐', parentCode: 'OLIVIA2024', position: 'Backspot', groupIds: ['group-jv'] },
  { id: '4', name: 'Ava Davis', avatar: '🌟', parentCode: 'AVA2024', position: 'Tumbler', groupIds: ['group-freshman'] },
  { id: '5', name: 'Isabella Martinez', avatar: '💫', parentCode: 'ISABELLA2024', position: 'Base', groupIds: ['group-varsity'] },
];

const categoryById = (id) => defaultPointCategories.find(c => c.id === id);

// [cheerleaderId, categoryId, daysAgo, note]
const sampleAwards = [
  ['1', 'nailed-routine', 1, 'Hit the full routine clean at practice'],
  ['1', 'on-time', 2, ''],
  ['1', 'distracted', 3, 'On her phone during stretches'],
  ['2', 'showed-leadership', 1, 'Ran warmups for the whole squad'],
  ['2', 'positive-energy', 2, ''],
  ['2', 'helped-teammate', 4, 'Spotted Ava on her back handspring'],
  ['2', 'unprepared', 6, 'Forgot her practice shoes'],
  ['3', 'improved-skill', 2, 'Landed her tuck for the first time'],
  ['3', 'worked-hard', 3, ''],
  ['3', 'great-attitude', 5, ''],
  ['4', 'extra-effort', 1, 'Stayed late to work on tumbling'],
  ['4', 'late', 4, 'Twenty minutes late, no heads up'],
  ['4', 'encouraged-others', 7, ''],
  ['5', 'nailed-routine', 2, ''],
  ['5', 'great-attitude', 3, ''],
  ['5', 'helped-teammate', 5, ''],
  ['5', 'worked-hard', 8, ''],
];

// Built lazily so every reset gets timestamps relative to "now".
export const buildSampleHistory = (seasonId) =>
  sampleAwards
    .map(([cheerleaderId, categoryId, daysAgo, note], index) => {
      const category = categoryById(categoryId);
      const timestamp = new Date(Date.now() - daysAgo * 86400000 - index * 3600000).toISOString();
      return {
        id: `sample-${index}`,
        cheerleaderId,
        category,
        points: category.points,
        isMerit: category.type === 'merit',
        note,
        timestamp,
        awardedBy: 'Coach',
        seasonId,
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

export const buildSampleCheerleaders = (history) =>
  sampleRoster.map(c => {
    const total = history
      .filter(h => h.cheerleaderId === c.id)
      .reduce((sum, h) => sum + h.points, 0);
    const earned = history
      .filter(h => h.cheerleaderId === c.id && h.points > 0)
      .reduce((sum, h) => sum + h.points, 0);
    return {
      ...c,
      totalPoints: total,
      lifetimePoints: earned,
      notes: '',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };
  });

// Available avatars for selection
export const avatarOptions = ['🎀', '💖', '⭐', '🌟', '💫', '🦋', '🌸', '💜', '🩷', '🎯', '🏆', '💎', '🌺', '🦄', '🎪'];
