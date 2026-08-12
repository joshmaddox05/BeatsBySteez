import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  SCHEMA_VERSION,
  STORAGE_KEYS,
  buildDemoState,
  clearAll,
  generateParentCode,
  loadPersistedState,
  persistSlice,
  renumberCategories,
} from '../data/persistence';
import { getPresetPack } from '../data/presetPacks';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const isSameLocalDay = (timestamp, reference) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
};

export const AppProvider = ({ children }) => {
  // Load, migrate, and normalize localStorage once, before first paint. Doing
  // this in a mount effect (as this used to) meant one render against empty
  // state and made every save effect fire against that empty state.
  const boot = useMemo(() => loadPersistedState(), []);

  // User state
  const [currentUser, setCurrentUser] = useState(boot.currentUser);
  const [userRole, setUserRole] = useState(boot.userRole);

  // Data state
  const [cheerleaders, setCheerleaders] = useState(boot.cheerleaders);
  const [pointHistory, setPointHistory] = useState(boot.pointHistory);
  const [pointCategories, setPointCategories] = useState(boot.pointCategories);
  const [groups, setGroups] = useState(boot.groups);
  const [rewardTiers, setRewardTiers] = useState(boot.rewardTiers);
  const [squadRules, setSquadRules] = useState(boot.squadRules);
  const [currentSeason, setCurrentSeason] = useState(boot.currentSeason);
  const [seasons, setSeasons] = useState(boot.seasons);
  const [announcements, setAnnouncements] = useState(boot.announcements);
  const [messages, setMessages] = useState(boot.messages);

  // Awarding validates against the *live* roster and history, not a render-time
  // snapshot — otherwise a bulk award would evaluate every cheerleader against
  // the same stale data and blow past the daily cap. These refs are the source
  // of truth during a mutation; state is what renders.
  const historyRef = useRef(boot.pointHistory);
  const cheerleadersRef = useRef(boot.cheerleaders);

  const commitHistory = useCallback((next) => {
    const value = typeof next === 'function' ? next(historyRef.current) : next;
    historyRef.current = value;
    setPointHistory(value);
    return value;
  }, []);

  const commitCheerleaders = useCallback((next) => {
    const value = typeof next === 'function' ? next(cheerleadersRef.current) : next;
    cheerleadersRef.current = value;
    setCheerleaders(value);
    return value;
  }, []);

  // Save to localStorage when data changes
  useEffect(() => persistSlice(STORAGE_KEYS.cheerleaders, cheerleaders), [cheerleaders]);
  useEffect(() => persistSlice(STORAGE_KEYS.pointHistory, pointHistory), [pointHistory]);
  useEffect(() => persistSlice(STORAGE_KEYS.pointCategories, pointCategories), [pointCategories]);
  useEffect(() => persistSlice(STORAGE_KEYS.groups, groups), [groups]);
  useEffect(() => persistSlice(STORAGE_KEYS.rewardTiers, rewardTiers), [rewardTiers]);
  useEffect(() => persistSlice(STORAGE_KEYS.squadRules, squadRules), [squadRules]);
  useEffect(() => persistSlice(STORAGE_KEYS.currentSeason, currentSeason), [currentSeason]);
  useEffect(() => persistSlice(STORAGE_KEYS.seasons, seasons), [seasons]);
  useEffect(() => persistSlice(STORAGE_KEYS.announcements, announcements), [announcements]);
  useEffect(() => persistSlice(STORAGE_KEYS.messages, messages), [messages]);

  // ---------------------------------------------------------------- categories

  // PointModal (and anything else picking a category) reads these two lists.
  // They are derived so there is exactly one place to edit a category.
  const meritCategories = useMemo(
    () => pointCategories.filter(c => c.type !== 'demerit').sort((a, b) => a.order - b.order),
    [pointCategories]
  );
  const demeritCategories = useMemo(
    () => pointCategories.filter(c => c.type === 'demerit').sort((a, b) => a.order - b.order),
    [pointCategories]
  );

  const normalizePoints = (points, type) => {
    const magnitude = Math.abs(Number(points) || 0);
    return type === 'demerit' ? -magnitude : magnitude;
  };

  const addCategory = useCallback(({ name, icon, points, type }) => {
    const kind = type === 'demerit' ? 'demerit' : 'merit';
    const category = {
      id: uuidv4(),
      name: (name || '').trim() || 'Untitled',
      icon: icon || (kind === 'merit' ? '⭐' : '⚠️'),
      points: normalizePoints(points, kind),
      type: kind,
      order: Number.MAX_SAFE_INTEGER, // renumber puts it last within its type
    };
    setPointCategories(prev => renumberCategories([...prev, category]));
    return category;
  }, []);

  const updateCategory = useCallback((id, updates) => {
    setPointCategories(prev => {
      const next = prev.map(c => {
        if (c.id !== id) return c;
        const merged = { ...c, ...updates };
        const kind = merged.type === 'demerit' ? 'demerit' : 'merit';
        // Moving a category across types puts it at the end of its new list.
        const order = kind === c.type ? merged.order : Number.MAX_SAFE_INTEGER;
        return { ...merged, type: kind, points: normalizePoints(merged.points, kind), order };
      });
      return renumberCategories(next);
    });
  }, []);

  // History embeds a snapshot of the category, so deleting one never rewrites
  // or orphans past awards — old entries keep rendering what was awarded.
  const deleteCategory = useCallback((id) => {
    setPointCategories(prev => renumberCategories(prev.filter(c => c.id !== id)));
  }, []);

  const reorderCategory = useCallback((id, direction) => {
    setPointCategories(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;
      const siblings = prev
        .filter(c => c.type === target.type)
        .sort((a, b) => a.order - b.order);
      const index = siblings.findIndex(c => c.id === id);
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= siblings.length) return prev;

      const reordered = [...siblings];
      [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
      const orderById = new Map(reordered.map((c, i) => [c.id, i]));
      return renumberCategories(
        prev.map(c => (orderById.has(c.id) ? { ...c, order: orderById.get(c.id) } : c))
      );
    });
  }, []);

  // mode: 'replace' wipes the current list, 'append' adds alongside it.
  const loadPresetPack = useCallback((packId, mode = 'replace') => {
    const pack = getPresetPack(packId);
    if (!pack) return { added: 0, removed: 0 };

    const minted = pack.categories.map(c => ({
      ...c,
      id: uuidv4(),
      type: c.type === 'demerit' ? 'demerit' : 'merit',
      points: normalizePoints(c.points, c.type),
      order: Number.MAX_SAFE_INTEGER,
    }));

    let removed = 0;
    setPointCategories(prev => {
      removed = mode === 'replace' ? prev.length : 0;
      const base = mode === 'replace' ? [] : prev;
      // Keep 'append' from stacking duplicates of the same name+type.
      const existing = new Set(base.map(c => `${c.type}:${c.name.toLowerCase()}`));
      const fresh = minted.filter(c => !existing.has(`${c.type}:${c.name.toLowerCase()}`));
      return renumberCategories([...base, ...fresh]);
    });
    return { added: minted.length, removed };
  }, []);

  // --------------------------------------------------------------- reward tiers

  const sortedTiers = useMemo(
    () => [...rewardTiers].sort((a, b) => a.threshold - b.threshold),
    [rewardTiers]
  );

  const getTierForPoints = useCallback(
    (points) => {
      const total = Number(points) || 0;
      let reached = null;
      sortedTiers.forEach(tier => {
        if (total >= tier.threshold) reached = tier;
      });
      return reached;
    },
    [sortedTiers]
  );

  const getNextTier = useCallback(
    (points) => {
      const total = Number(points) || 0;
      const next = sortedTiers.find(tier => total < tier.threshold);
      return next ? { tier: next, pointsAway: next.threshold - total } : null;
    },
    [sortedTiers]
  );

  const addRewardTier = useCallback(({ name, icon, threshold }) => {
    const tier = {
      id: uuidv4(),
      name: (name || '').trim() || 'New Tier',
      icon: icon || '⭐',
      threshold: Math.max(0, Number(threshold) || 0),
    };
    setRewardTiers(prev => [...prev, tier]);
    return tier;
  }, []);

  const updateRewardTier = useCallback((id, updates) => {
    setRewardTiers(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              ...updates,
              threshold:
                updates.threshold === undefined
                  ? t.threshold
                  : Math.max(0, Number(updates.threshold) || 0),
            }
          : t
      )
    );
  }, []);

  const deleteRewardTier = useCallback((id) => {
    setRewardTiers(prev => prev.filter(t => t.id !== id));
  }, []);

  // --------------------------------------------------------------- squad rules

  const updateSquadRules = useCallback((updates) => {
    setSquadRules(prev => {
      const next = { ...prev, ...updates };
      next.dailyPointCap = Math.max(0, Number(next.dailyPointCap) || 0);
      return next;
    });
  }, []);

  // -------------------------------------------------------------------- groups

  const addGroup = useCallback(({ name, icon, color }) => {
    const group = {
      id: uuidv4(),
      name: (name || '').trim() || 'New Group',
      icon: icon || '🏆',
      color: color || '#6366f1',
      createdAt: new Date().toISOString(),
    };
    setGroups(prev => [...prev, group]);
    return group;
  }, []);

  const updateGroup = useCallback((id, updates) => {
    setGroups(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  const deleteGroup = useCallback((id) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    commitCheerleaders(prev =>
      prev.map(c => ({ ...c, groupIds: (c.groupIds || []).filter(gid => gid !== id) }))
    );
  }, [commitCheerleaders]);

  const setCheerleaderGroups = useCallback((cheerleaderId, groupIds) => {
    commitCheerleaders(prev =>
      prev.map(c => (c.id === cheerleaderId ? { ...c, groupIds: [...groupIds] } : c))
    );
  }, [commitCheerleaders]);

  const setGroupMembers = useCallback((groupId, cheerleaderIds) => {
    commitCheerleaders(prev =>
      prev.map(c => {
        const current = (c.groupIds || []).filter(gid => gid !== groupId);
        return cheerleaderIds.includes(c.id)
          ? { ...c, groupIds: [...current, groupId] }
          : { ...c, groupIds: current };
      })
    );
  }, [commitCheerleaders]);

  const getGroupMembers = useCallback(
    (groupId) => cheerleaders.filter(c => (c.groupIds || []).includes(groupId)),
    [cheerleaders]
  );

  const getGroupsFor = useCallback(
    (cheerleaderId) => {
      const cheerleader = cheerleaders.find(c => c.id === cheerleaderId);
      if (!cheerleader) return [];
      return groups.filter(g => (cheerleader.groupIds || []).includes(g.id));
    },
    [cheerleaders, groups]
  );

  // ---------------------------------------------------------------------- auth

  const loginAsCoach = useCallback((name) => {
    const user = { id: 'coach', name, role: 'coach' };
    setCurrentUser(user);
    setUserRole('coach');
    persistSlice(STORAGE_KEYS.currentUser, user);
    localStorage.setItem(STORAGE_KEYS.userRole, 'coach');
  }, []);

  const loginAsCheerleader = useCallback((cheerleaderId) => {
    const cheerleader = cheerleadersRef.current.find(c => c.id === cheerleaderId);
    if (!cheerleader) return false;
    const user = { ...cheerleader, role: 'cheerleader' };
    setCurrentUser(user);
    setUserRole('cheerleader');
    persistSlice(STORAGE_KEYS.currentUser, user);
    localStorage.setItem(STORAGE_KEYS.userRole, 'cheerleader');
    return true;
  }, []);

  const loginAsParent = useCallback((parentCode) => {
    const cheerleader = cheerleadersRef.current.find(c => c.parentCode === parentCode);
    if (!cheerleader) return false;
    const user = {
      id: `parent-${cheerleader.id}`,
      name: `${cheerleader.name}'s Parent`,
      childId: cheerleader.id,
      role: 'parent',
    };
    setCurrentUser(user);
    setUserRole('parent');
    persistSlice(STORAGE_KEYS.currentUser, user);
    localStorage.setItem(STORAGE_KEYS.userRole, 'parent');
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.userRole);
  }, []);

  // ------------------------------------------------------- cheerleader roster

  const addCheerleader = useCallback((name, avatar, extras = {}) => {
    const takenCodes = cheerleadersRef.current.map(c => c.parentCode);
    const newCheerleader = {
      id: uuidv4(),
      name,
      avatar,
      parentCode: generateParentCode(name, takenCodes),
      totalPoints: 0,
      lifetimePoints: 0,
      groupIds: [],
      position: '',
      notes: '',
      createdAt: new Date().toISOString(),
      ...extras,
    };
    commitCheerleaders(prev => [...prev, newCheerleader]);
    return newCheerleader;
  }, [commitCheerleaders]);

  const updateCheerleader = useCallback((id, updates) => {
    commitCheerleaders(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    // A logged-in cheerleader's session is a snapshot of her record, so a coach
    // edit has to reach it too or her own dashboard shows the old name/avatar.
    setCurrentUser(prev => {
      if (!prev || prev.id !== id) return prev;
      const patched = { ...prev, ...updates };
      persistSlice(STORAGE_KEYS.currentUser, patched);
      return patched;
    });
  }, [commitCheerleaders]);

  const regenerateParentCode = useCallback((id) => {
    const taken = cheerleadersRef.current.filter(c => c.id !== id).map(c => c.parentCode);
    const code = generateParentCode(
      cheerleadersRef.current.find(c => c.id === id)?.name,
      taken
    );
    commitCheerleaders(prev => prev.map(c => (c.id === id ? { ...c, parentCode: code } : c)));
    return code;
  }, [commitCheerleaders]);

  const removeCheerleader = useCallback((id) => {
    commitCheerleaders(prev => prev.filter(c => c.id !== id));
    commitHistory(prev => prev.filter(p => p.cheerleaderId !== id));
  }, [commitCheerleaders, commitHistory]);

  // -------------------------------------------------------------------- points

  const getCheerleaderHistory = useCallback(
    (cheerleaderId, options = {}) =>
      pointHistory.filter(
        p =>
          p.cheerleaderId === cheerleaderId &&
          (!options.seasonId || p.seasonId === options.seasonId)
      ),
    [pointHistory]
  );

  // Sum of point *magnitudes* awarded to one cheerleader today, merits and
  // demerits combined — that is what dailyPointCap limits.
  const getTodayPointTotal = useCallback((cheerleaderId) => {
    const now = new Date();
    return historyRef.current
      .filter(p => p.cheerleaderId === cheerleaderId && isSameLocalDay(p.timestamp, now))
      .reduce((sum, p) => sum + Math.abs(p.points || 0), 0);
  }, []);

  // Applies the squad rules to one prospective award. Returns either a ready-to
  // -commit entry or a rejection with a message the UI can show as-is.
  // Rules can shrink an award (daily cap, zero floor); when they do, the entry
  // records the points that were *actually* applied while entry.category.points
  // keeps the category's nominal value. removePointEntry undoes entry.points,
  // so totals stay reconciled with history either way.
  const evaluateAward = useCallback(
    (cheerleader, category, isMerit, note, usedTodayOverride) => {
      if (!cheerleader) {
        return { ok: false, reason: 'not-found', message: 'That cheerleader no longer exists.' };
      }

      const merit = typeof isMerit === 'boolean' ? isMerit : category.type !== 'demerit';
      const magnitude = Math.abs(Number(category.points) || 0);
      const nominal = merit ? magnitude : -magnitude;
      let applied = nominal;
      let capped = false;
      let clamped = false;

      if (squadRules.requireNoteOnDemerits && !merit && !String(note || '').trim()) {
        return {
          ok: false,
          reason: 'note-required',
          message: 'A note is required for demerits.',
        };
      }

      if (squadRules.dailyPointCap > 0) {
        const used =
          usedTodayOverride === undefined ? getTodayPointTotal(cheerleader.id) : usedTodayOverride;
        const remaining = squadRules.dailyPointCap - used;
        if (remaining <= 0) {
          return {
            ok: false,
            reason: 'daily-cap',
            message: `${cheerleader.name} has hit today's ${squadRules.dailyPointCap}-point limit.`,
          };
        }
        if (Math.abs(applied) > remaining) {
          applied = merit ? remaining : -remaining;
          capped = true;
        }
      }

      const total = Number(cheerleader.totalPoints) || 0;
      if (!squadRules.allowNegativeTotals && total + applied < 0) {
        applied = -total;
        clamped = true;
      }

      if (applied === 0) {
        return {
          ok: false,
          reason: 'floor-reached',
          message: merit
            ? `No points left to award ${cheerleader.name} today.`
            : `${cheerleader.name} is already at 0 points.`,
        };
      }

      return { ok: true, applied, nominal, capped, clamped, merit };
    },
    [squadRules, getTodayPointTotal]
  );

  const awardPoints = useCallback(
    (cheerleaderId, category, isMerit, note = '') => {
      const cheerleader = cheerleadersRef.current.find(c => c.id === cheerleaderId);
      const verdict = evaluateAward(cheerleader, category, isMerit, note);
      if (!verdict.ok) return verdict;

      const entry = {
        id: uuidv4(),
        cheerleaderId,
        category,
        points: verdict.applied,
        isMerit: verdict.merit,
        note,
        timestamp: new Date().toISOString(),
        awardedBy: currentUser?.name || 'Coach',
        seasonId: currentSeason.id,
      };

      commitHistory(prev => [entry, ...prev]);
      commitCheerleaders(prev =>
        prev.map(c =>
          c.id === cheerleaderId
            ? {
                ...c,
                totalPoints: (c.totalPoints || 0) + verdict.applied,
                lifetimePoints: (c.lifetimePoints || 0) + Math.max(0, verdict.applied),
              }
            : c
        )
      );

      return { ...verdict, entry };
    },
    [evaluateAward, currentUser, currentSeason, commitHistory, commitCheerleaders]
  );

  // Best-effort per cheerleader: the squad rules can legitimately reject some
  // targets and not others, so the caller gets a per-target result to show.
  const bulkAwardPoints = useCallback(
    (cheerleaderIds, category, isMerit, note = '') => {
      const bulkId = uuidv4();
      const timestamp = new Date().toISOString();
      const uniqueIds = [...new Set(cheerleaderIds)];
      const entries = [];
      const results = [];
      const deltas = new Map();

      uniqueIds.forEach(id => {
        const cheerleader = cheerleadersRef.current.find(c => c.id === id);
        const verdict = evaluateAward(cheerleader, category, isMerit, note);
        if (!verdict.ok) {
          results.push({
            cheerleaderId: id,
            name: cheerleader?.name || 'Unknown',
            ok: false,
            reason: verdict.reason,
            message: verdict.message,
          });
          return;
        }
        entries.push({
          id: uuidv4(),
          cheerleaderId: id,
          category,
          points: verdict.applied,
          isMerit: verdict.merit,
          note,
          timestamp,
          awardedBy: currentUser?.name || 'Coach',
          seasonId: currentSeason.id,
          bulkId,
        });
        deltas.set(id, verdict.applied);
        results.push({
          cheerleaderId: id,
          name: cheerleader.name,
          ok: true,
          applied: verdict.applied,
          capped: verdict.capped,
          clamped: verdict.clamped,
        });
      });

      if (entries.length > 0) {
        commitHistory(prev => [...entries, ...prev]);
        commitCheerleaders(prev =>
          prev.map(c =>
            deltas.has(c.id)
              ? {
                  ...c,
                  totalPoints: (c.totalPoints || 0) + deltas.get(c.id),
                  lifetimePoints: (c.lifetimePoints || 0) + Math.max(0, deltas.get(c.id)),
                }
              : c
          )
        );
      }

      return {
        bulkId,
        successCount: results.filter(r => r.ok).length,
        failCount: results.filter(r => !r.ok).length,
        results,
      };
    },
    [evaluateAward, currentUser, currentSeason, commitHistory, commitCheerleaders]
  );

  const removePointEntry = useCallback(
    (entryId) => {
      const entry = historyRef.current.find(p => p.id === entryId);
      if (!entry) return;
      const points = entry.points || 0;
      commitHistory(prev => prev.filter(p => p.id !== entryId));
      commitCheerleaders(prev =>
        prev.map(c =>
          c.id === entry.cheerleaderId
            ? {
                ...c,
                totalPoints: (c.totalPoints || 0) - points,
                lifetimePoints: Math.max(0, (c.lifetimePoints || 0) - Math.max(0, points)),
              }
            : c
        )
      );
    },
    [commitHistory, commitCheerleaders]
  );

  // ------------------------------------------------------------------- seasons

  const getSeasonEntries = useCallback(
    (seasonId) => pointHistory.filter(p => p.seasonId === seasonId),
    [pointHistory]
  );

  // Archives the current standings and zeroes totals. History is never deleted
  // — every entry keeps its seasonId, so past seasons stay fully browsable.
  const startNewSeason = useCallback(
    (name) => {
      const now = new Date().toISOString();
      const roster = cheerleadersRef.current;
      const archived = {
        ...currentSeason,
        endedAt: now,
        entryCount: historyRef.current.filter(p => p.seasonId === currentSeason.id).length,
        standings: [...roster]
          .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
          .map(c => ({
            cheerleaderId: c.id,
            name: c.name,
            avatar: c.avatar,
            totalPoints: c.totalPoints || 0,
            tierName: getTierForPoints(c.totalPoints || 0)?.name || null,
          })),
      };
      const next = {
        id: uuidv4(),
        name: (name || '').trim() || `Season ${seasons.length + 2}`,
        startedAt: now,
      };

      setSeasons(prev => [archived, ...prev]);
      setCurrentSeason(next);
      commitCheerleaders(prev => prev.map(c => ({ ...c, totalPoints: 0 })));
      return { archived, current: next };
    },
    [currentSeason, seasons, getTierForPoints, commitCheerleaders]
  );

  const deleteArchivedSeason = useCallback((id) => {
    setSeasons(prev => prev.filter(s => s.id !== id));
  }, []);

  // ------------------------------------------------------------- announcements

  const addAnnouncement = useCallback(
    (title, content) => {
      const announcement = {
        id: uuidv4(),
        title,
        content,
        timestamp: new Date().toISOString(),
        author: currentUser?.name || 'Coach',
      };
      setAnnouncements(prev => [announcement, ...prev]);
      return announcement;
    },
    [currentUser]
  );

  const removeAnnouncement = useCallback((id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  // ------------------------------------------------------------------ messages

  const sendMessage = useCallback(
    (toId, content) => {
      const message = {
        id: uuidv4(),
        fromId: currentUser?.id,
        fromName: currentUser?.name,
        fromRole: userRole,
        toId,
        content,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [message, ...prev]);
      return message;
    },
    [currentUser, userRole]
  );

  const getMessagesForUser = useCallback(
    (userId) => messages.filter(m => m.toId === userId || m.fromId === userId),
    [messages]
  );

  const markMessageAsRead = useCallback((messageId) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, read: true } : m)));
  }, []);

  const markThreadAsRead = useCallback((counterpartId, recipientId) => {
    setMessages(prev =>
      prev.map(m =>
        m.toId === recipientId && m.fromId === counterpartId && !m.read ? { ...m, read: true } : m
      )
    );
  }, []);

  const getUnreadCount = useCallback(
    (userId) => messages.filter(m => m.toId === userId && !m.read).length,
    [messages]
  );

  // ------------------------------------------------------------------- utility

  const resetToDemo = useCallback(() => {
    const demo = buildDemoState();
    clearAll();
    // clearAll() wipes the version marker too; re-stamp it so the next load
    // doesn't mistake a fresh reset for a legacy install needing migration.
    persistSlice(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION);
    commitCheerleaders(demo.cheerleaders);
    commitHistory(demo.pointHistory);
    setPointCategories(demo.pointCategories);
    setGroups(demo.groups);
    setRewardTiers(demo.rewardTiers);
    setSquadRules(demo.squadRules);
    setCurrentSeason(demo.currentSeason);
    setSeasons(demo.seasons);
    setAnnouncements(demo.announcements);
    setMessages(demo.messages);
    // clearAll() wiped the session too; keep the coach signed in.
    if (currentUser && userRole) {
      persistSlice(STORAGE_KEYS.currentUser, currentUser);
      localStorage.setItem(STORAGE_KEYS.userRole, userRole);
    }
  }, [currentUser, userRole, commitCheerleaders, commitHistory]);

  const value = {
    // State
    currentUser,
    userRole,
    cheerleaders,
    pointHistory,
    pointCategories,
    meritCategories,
    demeritCategories,
    groups,
    rewardTiers,
    squadRules,
    currentSeason,
    seasons,
    announcements,
    messages,

    // Auth
    loginAsCoach,
    loginAsCheerleader,
    loginAsParent,
    logout,

    // Cheerleader management
    addCheerleader,
    updateCheerleader,
    removeCheerleader,
    regenerateParentCode,

    // Points
    awardPoints,
    bulkAwardPoints,
    removePointEntry,
    getCheerleaderHistory,
    getTodayPointTotal,

    // Categories
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    loadPresetPack,

    // Groups
    addGroup,
    updateGroup,
    deleteGroup,
    setCheerleaderGroups,
    setGroupMembers,
    getGroupMembers,
    getGroupsFor,

    // Reward tiers
    addRewardTier,
    updateRewardTier,
    deleteRewardTier,
    getTierForPoints,
    getNextTier,

    // Rules
    updateSquadRules,

    // Seasons
    startNewSeason,
    getSeasonEntries,
    deleteArchivedSeason,

    // Announcements
    addAnnouncement,
    removeAnnouncement,

    // Messages
    sendMessage,
    getMessagesForUser,
    markMessageAsRead,
    markThreadAsRead,
    getUnreadCount,

    // Utility
    resetToDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
