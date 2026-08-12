// localStorage loading, migration, and saving.
//
// Everything the app persists goes through here so that (a) corrupt or
// half-written data can never white-screen the app on boot, and (b) data saved
// by an older version of the app gets brought up to the current shape exactly
// once, at load time.

import { v4 as uuidv4 } from 'uuid';
import {
  defaultPointCategories,
  defaultSquadRules,
  buildSampleHistory,
  buildSampleCheerleaders,
} from './defaultCategories';
import { defaultRewardTiers } from './defaultRewardTiers';
import { buildDefaultGroups } from './defaultGroups';

export const SCHEMA_VERSION = 2;

export const STORAGE_KEYS = {
  cheerleaders: 'cheerleaders',
  pointHistory: 'pointHistory',
  pointCategories: 'pointCategories',
  groups: 'groups',
  rewardTiers: 'rewardTiers',
  squadRules: 'squadRules',
  currentSeason: 'currentSeason',
  seasons: 'seasons',
  announcements: 'announcements',
  messages: 'messages',
  currentUser: 'currentUser',
  userRole: 'userRole',
  schemaVersion: 'schemaVersion',
};

// Keys written by the provider's save effects. currentUser/userRole are written
// by the auth functions instead, and schemaVersion only by this module.
export const PERSISTED_SLICES = [
  'cheerleaders',
  'pointHistory',
  'pointCategories',
  'groups',
  'rewardTiers',
  'squadRules',
  'currentSeason',
  'seasons',
  'announcements',
  'messages',
];

// Returns undefined when the key is absent and `fallback` when it is present
// but unparseable. The caller needs that distinction: an absent cheerleaders
// key means "seed the demo squad", an empty array means "the coach deleted
// everyone".
export const safeParse = (key, fallback = undefined) => {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch {
    console.warn(`[persistence] Discarding unreadable "${key}" from localStorage.`);
    return fallback;
  }
};

export const persistSlice = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Quota exceeded or storage disabled — the app stays usable in memory.
    console.warn(`[persistence] Could not save "${key}":`, err);
  }
};

export const clearAll = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
};

export const generateParentCode = (name, taken = []) => {
  const base = (name || 'CHEER').split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'CHEER';
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!taken.includes(code)) return code;
  }
  // Vanishingly unlikely; fall back to something guaranteed unique.
  return `${base}${uuidv4().slice(0, 6).toUpperCase()}`;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeCategory = (category, index) => ({
  ...category,
  id: category.id || uuidv4(),
  name: category.name || 'Untitled',
  icon: category.icon || '⭐',
  type: category.type || ((category.points ?? 0) >= 0 ? 'merit' : 'demerit'),
  points: Number(category.points) || 0,
  order: Number.isFinite(category.order) ? category.order : index,
});

// Rewrites `order` so each type is contiguous 0..n-1 in its current sort order.
export const renumberCategories = (categories) => {
  const next = [];
  ['merit', 'demerit'].forEach(type => {
    categories
      .filter(c => c.type === type)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((c, i) => next.push({ ...c, order: i }));
  });
  return next;
};

const seedDemoData = (seasonId) => {
  const pointHistory = buildSampleHistory(seasonId);
  return { cheerleaders: buildSampleCheerleaders(pointHistory), pointHistory };
};

// Brings a loaded draft up to SCHEMA_VERSION. Also acts as a normalizer on
// already-current data, so hand-edited localStorage can't crash the app.
const migrate = (draft) => {
  const out = { ...draft };

  // --- Season -------------------------------------------------------------
  const historyForDates = asArray(out.pointHistory);
  const earliest = historyForDates
    .map(h => h?.timestamp)
    .filter(Boolean)
    .sort()[0];
  out.currentSeason = out.currentSeason && out.currentSeason.id
    ? out.currentSeason
    : { id: uuidv4(), name: 'Season 1', startedAt: earliest || new Date().toISOString() };
  out.seasons = asArray(out.seasons);

  // --- Cheerleaders + history --------------------------------------------
  if (out.cheerleaders === undefined) {
    const demo = seedDemoData(out.currentSeason.id);
    out.cheerleaders = demo.cheerleaders;
    if (out.pointHistory === undefined) out.pointHistory = demo.pointHistory;
  }

  // Groups are seeded only when the key is absent — an empty array means the
  // coach deleted them all, which we must not undo.
  const groupsWereAbsent = out.groups === undefined;

  const usedCodes = [];
  out.cheerleaders = asArray(out.cheerleaders)
    .filter(c => c && c.id)
    .map(c => {
      const totalPoints = Number(c.totalPoints) || 0;
      let parentCode = c.parentCode;
      if (!parentCode || usedCodes.includes(parentCode)) {
        parentCode = generateParentCode(c.name, usedCodes);
      }
      usedCodes.push(parentCode);
      return {
        ...c,
        name: c.name || 'Unnamed',
        avatar: c.avatar || '🎀',
        parentCode,
        totalPoints,
        groupIds: asArray(c.groupIds),
        position: c.position || '',
        notes: c.notes || '',
        lifetimePoints: Number.isFinite(c.lifetimePoints)
          ? c.lifetimePoints
          : Math.max(0, totalPoints),
        createdAt: c.createdAt || out.currentSeason.startedAt,
      };
    });

  out.pointHistory = asArray(out.pointHistory)
    .filter(h => h && h.id && h.cheerleaderId)
    .map(h => {
      const points = Number(h.points) || 0;
      const isMerit = typeof h.isMerit === 'boolean' ? h.isMerit : points >= 0;
      const category = h.category && typeof h.category === 'object'
        ? {
            ...h.category,
            type: h.category.type || (isMerit ? 'merit' : 'demerit'),
            points: Number.isFinite(h.category.points) ? h.category.points : points,
          }
        : {
            id: 'legacy',
            name: 'Point Adjustment',
            icon: isMerit ? '⭐' : '⚠️',
            points,
            type: isMerit ? 'merit' : 'demerit',
          };
      return {
        ...h,
        points,
        isMerit,
        category,
        note: h.note || '',
        awardedBy: h.awardedBy || 'Coach',
        timestamp: h.timestamp || out.currentSeason.startedAt,
        seasonId: h.seasonId || out.currentSeason.id,
      };
    });

  // --- Categories ---------------------------------------------------------
  out.pointCategories = renumberCategories(
    (out.pointCategories === undefined
      ? defaultPointCategories
      : asArray(out.pointCategories).filter(Boolean)
    ).map(normalizeCategory)
  );

  // --- Groups -------------------------------------------------------------
  out.groups = (groupsWereAbsent ? buildDefaultGroups() : asArray(out.groups))
    .filter(g => g && g.id)
    .map(g => ({
      ...g,
      name: g.name || 'Group',
      icon: g.icon || '🏆',
      color: g.color || '#6366f1',
      createdAt: g.createdAt || new Date().toISOString(),
    }));

  // v1 stored a free-text `level` on each cheerleader. Groups do that job now, so
  // fold any stored level into the group of the same name and drop the field.
  // Deliberately not gated on schemaVersion: it is self-healing and idempotent
  // (once `level` is gone there is nothing left to fold), so it still repairs a
  // record that got stamped with a newer version before this ran.
  if (out.cheerleaders.some(c => c.level)) {
    const byName = new Map(out.groups.map(g => [g.name.trim().toLowerCase(), g.id]));
    buildDefaultGroups().forEach(seed => {
      // The coach may have deleted or never had these; add back only the ones
      // an existing level actually references, so no membership is lost.
      const needed = out.cheerleaders.some(
        c => (c.level || '').trim().toLowerCase() === seed.name.toLowerCase()
      );
      if (needed && !byName.has(seed.name.toLowerCase())) {
        out.groups.push(seed);
        byName.set(seed.name.toLowerCase(), seed.id);
      }
    });
    out.cheerleaders = out.cheerleaders.map(c => {
      const { level, ...rest } = c;
      const matched = byName.get((level || '').trim().toLowerCase());
      return {
        ...rest,
        groupIds: matched && !rest.groupIds.includes(matched)
          ? [...rest.groupIds, matched]
          : rest.groupIds,
      };
    });
  }

  // Drop memberships pointing at groups that no longer exist.
  const groupIds = out.groups.map(g => g.id);
  out.cheerleaders = out.cheerleaders.map(c => ({
    ...c,
    groupIds: c.groupIds.filter(id => groupIds.includes(id)),
  }));

  // --- Tiers, rules, announcements, messages -----------------------------
  out.rewardTiers = (out.rewardTiers === undefined
    ? defaultRewardTiers
    : asArray(out.rewardTiers).filter(t => t && t.id)
  ).map(t => ({
    ...t,
    name: t.name || 'Tier',
    icon: t.icon || '⭐',
    threshold: Number(t.threshold) || 0,
  }));

  out.squadRules = { ...defaultSquadRules, ...(out.squadRules || {}) };
  out.squadRules.dailyPointCap = Math.max(0, Number(out.squadRules.dailyPointCap) || 0);

  out.announcements = asArray(out.announcements).filter(a => a && a.id);
  out.messages = asArray(out.messages)
    .filter(m => m && m.id)
    .map(m => ({ ...m, read: m.read === true }));

  return out;
};

// Reads and migrates everything in one pass. Safe to call during render.
export const loadPersistedState = () => {
  const version = Number(safeParse(STORAGE_KEYS.schemaVersion, 0)) || 0;

  const draft = {
    cheerleaders: safeParse(STORAGE_KEYS.cheerleaders),
    pointHistory: safeParse(STORAGE_KEYS.pointHistory),
    pointCategories: safeParse(STORAGE_KEYS.pointCategories),
    groups: safeParse(STORAGE_KEYS.groups),
    rewardTiers: safeParse(STORAGE_KEYS.rewardTiers),
    squadRules: safeParse(STORAGE_KEYS.squadRules),
    currentSeason: safeParse(STORAGE_KEYS.currentSeason),
    seasons: safeParse(STORAGE_KEYS.seasons),
    announcements: safeParse(STORAGE_KEYS.announcements),
    messages: safeParse(STORAGE_KEYS.messages),
  };

  const state = migrate(draft);

  PERSISTED_SLICES.forEach(key => persistSlice(STORAGE_KEYS[key], state[key]));
  if (version !== SCHEMA_VERSION) {
    persistSlice(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION);
  }

  const savedUser = safeParse(STORAGE_KEYS.currentUser);
  let userRole = null;
  try {
    userRole = localStorage.getItem(STORAGE_KEYS.userRole);
  } catch {
    userRole = null;
  }

  return {
    ...state,
    currentUser: savedUser && savedUser.id && userRole ? savedUser : null,
    userRole: savedUser && savedUser.id && userRole ? userRole : null,
  };
};

// Fresh demo state, used by "Reset Demo".
export const buildDemoState = () => {
  const currentSeason = { id: uuidv4(), name: 'Season 1', startedAt: new Date().toISOString() };
  const { cheerleaders, pointHistory } = seedDemoData(currentSeason.id);
  return {
    cheerleaders,
    pointHistory,
    pointCategories: renumberCategories(defaultPointCategories.map(normalizeCategory)),
    groups: buildDefaultGroups(),
    rewardTiers: defaultRewardTiers,
    squadRules: { ...defaultSquadRules },
    currentSeason,
    seasons: [],
    announcements: [],
    messages: [],
  };
};
