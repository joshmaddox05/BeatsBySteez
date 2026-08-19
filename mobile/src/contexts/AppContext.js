import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import * as authApi from '../firebase/auth';
import * as squadApi from '../firebase/squad';
import { defaultSquadRules } from '../data/defaultCategories';
import { presetPacks } from '../data/presetPacks';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const toIsoString = (timestamp) => (timestamp && timestamp.toDate ? timestamp.toDate().toISOString() : new Date().toISOString());

export const AppProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = not fetched yet, null = signed out / no profile
  const [squad, setSquad] = useState(null); // { id, name, inviteCode, coachId }

  const [cheerleaders, setCheerleaders] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [meritCategories, setMeritCategories] = useState([]);
  const [demeritCategories, setDemeritCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rewardTiers, setRewardTiers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [customThreads, setCustomThreads] = useState([]);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setSquad(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Own profile doc (role, squadId, linkedCheerleaderId)
  useEffect(() => {
    if (!firebaseUser) return undefined;
    const unsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      setProfile(snap.exists() ? { uid: firebaseUser.uid, ...snap.data() } : null);
    });
    return unsubscribe;
  }, [firebaseUser]);

  // Squad doc
  useEffect(() => {
    if (!profile?.squadId) {
      setSquad(null);
      return undefined;
    }
    const unsubscribe = onSnapshot(doc(db, 'squads', profile.squadId), (snap) => {
      setSquad(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsubscribe;
  }, [profile?.squadId]);

  // Backfill defaults onto squads created before groups/tiers/seasons/coaches
  // existed. Coach-only: firestore.rules restrict these writes to the squad's
  // coach (or, for the coaches/{uid} bootstrap doc, the squad's own coachId).
  useEffect(() => {
    if (!profile?.squadId || profile.role !== 'coach') return;
    squadApi.ensureSquadDefaults(profile.squadId, profile.displayName).catch(() => {});
  }, [profile?.squadId, profile?.role, profile?.displayName]);

  // Every role self-heals its own members/{uid} roster doc on load — accounts
  // created before that roster existed (or any account, for any reason,
  // that's missing it) would otherwise be invisible in the "message these
  // people" picker. Nobody but the account owner can write this doc, so it
  // can't be backfilled from the coach's side.
  useEffect(() => {
    if (!profile?.squadId || !firebaseUser) return;
    squadApi
      .ensureOwnMemberDoc(profile.squadId, firebaseUser.uid, profile.role, profile.displayName, profile.linkedCheerleaderId)
      .catch(() => {});
  }, [profile?.squadId, profile?.role, profile?.displayName, profile?.linkedCheerleaderId, firebaseUser]);

  // Squad sub-collections
  useEffect(() => {
    const squadId = profile?.squadId;
    if (!squadId) {
      setCheerleaders([]);
      setPointHistory([]);
      setMeritCategories([]);
      setDemeritCategories([]);
      setAnnouncements([]);
      setMessages([]);
      setGroups([]);
      setRewardTiers([]);
      setSeasons([]);
      setEvents([]);
      setMembers([]);
      setCustomThreads([]);
      return undefined;
    }

    const unsubCheerleaders = onSnapshot(collection(db, 'squads', squadId, 'cheerleaders'), (snap) => {
      setCheerleaders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubHistory = onSnapshot(
      query(collection(db, 'squads', squadId, 'pointHistory'), orderBy('timestamp', 'desc')),
      (snap) => {
        setPointHistory(
          snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data, timestamp: toIsoString(data.timestamp), awardedBy: data.awardedByName };
          })
        );
      }
    );

    const unsubCategories = onSnapshot(collection(db, 'squads', squadId, 'categories'), (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setMeritCategories(all.filter((c) => c.isMerit));
      setDemeritCategories(all.filter((c) => !c.isMerit));
    });

    const unsubGroups = onSnapshot(collection(db, 'squads', squadId, 'groups'), (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Tiers are always read threshold-ascending so "highest tier reached" is a
    // simple scan from the end.
    const unsubTiers = onSnapshot(collection(db, 'squads', squadId, 'rewardTiers'), (snap) => {
      setRewardTiers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.threshold - b.threshold)
      );
    });

    const unsubSeasons = onSnapshot(collection(db, 'squads', squadId, 'seasons'), (snap) => {
      setSeasons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'squads', squadId, 'announcements'), orderBy('timestamp', 'desc')),
      (snap) => {
        setAnnouncements(
          snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data, timestamp: toIsoString(data.timestamp), author: data.authorName };
          })
        );
      }
    );

    const unsubMessages = onSnapshot(
      query(collection(db, 'squads', squadId, 'messages'), orderBy('timestamp', 'desc')),
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data, timestamp: toIsoString(data.timestamp) };
          })
        );
      }
    );

    const unsubEvents = onSnapshot(collection(db, 'squads', squadId, 'events'), (snap) => {
      setEvents(
        snap.docs
          .map((d) => {
            const data = d.data();
            return { id: d.id, ...data, createdAt: toIsoString(data.createdAt) };
          })
          .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      );
    });

    const unsubMembers = onSnapshot(collection(db, 'squads', squadId, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Filtered server-side (not just client-side) with array-contains: the
    // threads/{threadId} read rule checks resource.data.memberIds, and
    // Firestore rejects an entire unfiltered list query outright when the
    // rule can't be proven true for every possible result up front.
    //
    // Two queries, unioned: threads I'm a member of by uid, plus threads
    // addressed to my roster slot — which is how I find one started before I
    // had an account. array-contains can't be OR'd in a single query, and the
    // read rule mirrors the same two cases.
    const threadsRef = collection(db, 'squads', squadId, 'threads');
    const mySlot = squadApi.slotForRole(profile?.role, profile?.linkedCheerleaderId);
    const byMemberId = new Map();
    const bySlot = new Map();
    const publishThreads = () =>
      setCustomThreads([...new Map([...byMemberId, ...bySlot]).values()]);
    const collect = (target) => (snap) => {
      target.clear();
      snap.docs.forEach((d) => {
        const data = d.data();
        target.set(d.id, { id: d.id, ...data, createdAt: toIsoString(data.createdAt) });
      });
      publishThreads();
    };

    // Both thread listeners log rather than throw: an unhandled listener error
    // surfaces as a red box over the whole app, when an empty thread list plus
    // a line in the Metro log is the useful failure. A permission-denied here
    // almost always means firestore.rules needs redeploying.
    const onThreadsError = (label) => (e) =>
      console.log(`[threads:${label}] ${e.code} — redeploy firestore.rules?`);

    const unsubThreads = onSnapshot(
      query(threadsRef, where('memberIds', 'array-contains', firebaseUser.uid)),
      collect(byMemberId),
      onThreadsError('memberIds')
    );

    // Degrades to the uid-based thread list alone when firestore.rules hasn't
    // been redeployed with the memberSlots clause yet.
    const unsubSlotThreads = mySlot
      ? onSnapshot(
          query(threadsRef, where('memberSlots', 'array-contains', mySlot)),
          collect(bySlot),
          onThreadsError('memberSlots')
        )
      : undefined;

    return () => {
      unsubCheerleaders();
      unsubHistory();
      unsubCategories();
      unsubAnnouncements();
      unsubMessages();
      unsubGroups();
      unsubTiers();
      unsubSeasons();
      unsubEvents();
      unsubMembers();
      unsubThreads();
      if (unsubSlotThreads) unsubSlotThreads();
    };
  }, [profile?.squadId, firebaseUser?.uid, profile?.role, profile?.linkedCheerleaderId]);

  const currentUser = useMemo(() => {
    if (!firebaseUser || !profile) return null;
    return {
      id: firebaseUser.uid,
      name: profile.displayName,
      role: profile.role,
      childId: profile.role === 'parent' ? profile.linkedCheerleaderId : undefined,
      cheerleaderId: profile.role === 'cheerleader' ? profile.linkedCheerleaderId : undefined,
    };
  }, [firebaseUser, profile]);

  // Combined view of both category lists, for screens that render one grid.
  const pointCategories = useMemo(
    () => [...meritCategories, ...demeritCategories],
    [meritCategories, demeritCategories]
  );

  const userRole = profile?.role || null;
  const sessionLoading = authLoading || (!!firebaseUser && profile === undefined);

  // Auth actions
  const signUpCoach = (email, password, displayName, squadName) =>
    authApi.signUpCoach(email, password, displayName, squadName);

  const joinAsCoach = (email, password, displayName, squadId, coachInviteCode) =>
    authApi.joinAsCoach(email, password, displayName, squadId, coachInviteCode);

  const signUpCheerleaderAccount = (email, password, displayName, squadId, linkedCheerleaderId) =>
    authApi.signUpCheerleader(email, password, displayName, squadId, linkedCheerleaderId);

  const signUpParentAccount = (email, password, displayName, squadId, linkedCheerleaderId) =>
    authApi.signUpParent(email, password, displayName, squadId, linkedCheerleaderId);

  const signIn = (email, password) => authApi.signIn(email, password);

  const logout = () => authApi.logout();

  // Cheerleader management
  const addCheerleader = (name, avatar, extras = {}) =>
    squadApi.addCheerleader(profile.squadId, name, avatar, extras);
  const updateCheerleader = (id, updates) => squadApi.updateCheerleader(profile.squadId, id, updates);
  const removeCheerleader = (id) => squadApi.removeCheerleader(profile.squadId, id);

  // Points
  //
  // Applies the squad rules to a single award and reports what would actually
  // land. Callers award only when ok, and show `message` when not.
  const evaluateAward = (cheerleader, category, isMerit, note, usedTodayOverride) => {
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
      return { ok: false, reason: 'note-required', message: 'A note is required for demerits.' };
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
  };

  const awardPoints = async (cheerleaderId, category, isMerit, note = '') => {
    const cheerleader = cheerleaders.find((c) => c.id === cheerleaderId);
    const verdict = evaluateAward(cheerleader, category, isMerit, note);
    if (!verdict.ok) return verdict;

    const entry = await squadApi.awardPoints(
      profile.squadId,
      cheerleaderId,
      category,
      verdict.merit,
      note,
      firebaseUser.uid,
      profile.displayName,
      verdict.applied,
      currentSeason?.id
    );
    return { ...verdict, entry };
  };

  // Best-effort per cheerleader: the squad rules can legitimately reject some
  // targets and not others, so the caller gets a per-target result to show.
  const bulkAwardPoints = async (cheerleaderIds, category, isMerit, note = '') => {
    const bulkId = `bulk-${Date.now()}`;
    const uniqueIds = [...new Set(cheerleaderIds)];
    const awards = [];
    const results = [];

    uniqueIds.forEach((id) => {
      const cheerleader = cheerleaders.find((c) => c.id === id);
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
      awards.push({ cheerleaderId: id, points: verdict.applied });
      results.push({
        cheerleaderId: id,
        name: cheerleader.name,
        ok: true,
        applied: verdict.applied,
        capped: verdict.capped,
        clamped: verdict.clamped,
      });
    });

    await squadApi.bulkAwardPoints(
      profile.squadId,
      awards,
      category,
      typeof isMerit === 'boolean' ? isMerit : category.type !== 'demerit',
      note,
      firebaseUser.uid,
      profile.displayName,
      bulkId,
      currentSeason?.id
    );

    return {
      bulkId,
      successCount: results.filter((r) => r.ok).length,
      failCount: results.filter((r) => !r.ok).length,
      results,
    };
  };

  const removePointEntry = (entryId) => squadApi.removePointEntry(profile.squadId, entryId);

  const getCheerleaderHistory = (cheerleaderId) => pointHistory.filter((p) => p.cheerleaderId === cheerleaderId);

  // Announcements
  const addAnnouncement = (title, content) =>
    squadApi.addAnnouncement(profile.squadId, title, content, firebaseUser.uid, profile.displayName);
  const removeAnnouncement = (id) => squadApi.removeAnnouncement(profile.squadId, id);

  // Team calendar (lives alongside announcements)
  const addEvent = (event) => squadApi.addEvent(profile.squadId, event, firebaseUser.uid, profile.displayName);
  const updateEvent = (id, updates) => squadApi.updateEvent(profile.squadId, id, updates);
  const removeEvent = (id) => squadApi.removeEvent(profile.squadId, id);

  // Messages
  const sendMessage = (toId, content) =>
    squadApi.sendMessage(profile.squadId, firebaseUser.uid, profile.displayName, profile.role, toId, content);
  const getMessagesForUser = (userId) => messages.filter((m) => m.toId === userId || m.fromId === userId);
  const markMessageAsRead = (messageId) => squadApi.markMessageAsRead(profile.squadId, messageId);

  const markThreadAsRead = (otherId) => squadApi.markThreadAsRead(profile.squadId, firebaseUser.uid, otherId);

  // The signed-in user's own roster slot, or null for coaches (who aren't
  // linked to a cheerleader). Messages addressed to this slot are mine.
  const mySlot = squadApi.slotForRole(profile?.role, profile?.linkedCheerleaderId);

  // Slot messages: addressed to a spot on the roster rather than an account,
  // so a coach can write to a cheerleader or parent who hasn't signed up yet.
  const sendSlotMessage = (toSlot, content) =>
    squadApi.sendSlotMessage(profile.squadId, firebaseUser.uid, profile.displayName, profile.role, toSlot, content);

  // Takes the thread's own messages rather than a person id: one person's
  // thread can hold both slot-addressed and uid-addressed messages, and
  // clearing by person would also clear identical messages sitting in someone
  // else's thread.
  const markPersonThreadAsRead = (threadMessages) =>
    squadApi.markMessagesAsRead(profile.squadId, threadMessages, firebaseUser.uid);

  // Group threads: one per squad group (Varsity, JV, ...), open to the coach
  // and every parent/cheerleader linked to a member of that group.
  const sendGroupMessage = (groupId, content) => {
    const group = groups.find((g) => g.id === groupId);
    return squadApi.sendGroupMessage(
      profile.squadId,
      groupId,
      group?.name || 'Group',
      firebaseUser.uid,
      profile.displayName,
      profile.role,
      content
    );
  };
  const markGroupThreadAsRead = (groupId) =>
    squadApi.markGroupThreadAsRead(profile.squadId, groupId, firebaseUser.uid);

  // Custom threads: a hand-picked set of people, not tied to a squad group —
  // the "message these specific people" case. `participants` is
  // [{ uids, slot, name }], not including the caller (the caller is added on
  // the backend). Everyone on the roster contributes their slot as well as any
  // uid they already have, so the thread also finds accounts created after it.
  const createCustomThread = (participants) => {
    const memberIds = participants.flatMap((p) => p.uids || []);
    const memberNames = participants.reduce(
      (acc, p) => {
        (p.uids || []).forEach((uid) => {
          acc[uid] = p.name;
        });
        return acc;
      },
      { [firebaseUser.uid]: profile.displayName }
    );

    const onRoster = participants.filter((p) => p.slot);
    const memberSlots = onRoster.map((p) => p.slot);
    const slotNames = onRoster.reduce((acc, p) => ({ ...acc, [p.slot]: p.name }), {});

    return squadApi.createCustomThread(
      profile.squadId,
      firebaseUser.uid,
      memberIds,
      memberNames,
      memberSlots,
      slotNames
    );
  };
  const sendThreadMessage = (threadId, content) =>
    squadApi.sendThreadMessage(profile.squadId, threadId, firebaseUser.uid, profile.displayName, profile.role, content);
  const markCustomThreadAsRead = (threadId) =>
    squadApi.markCustomThreadAsRead(profile.squadId, threadId, firebaseUser.uid);

  // Only meaningful for the signed-in user (the only id every call site ever
  // passes) — a boolean `read` can't tell us group/custom-thread message
  // state for anyone else, since those are "read" independently by each
  // recipient.
  const getUnreadCount = (userId) => {
    const direct = messages.filter((m) => m.toId === userId && !m.read).length;
    if (userId !== currentUser?.id) return direct;

    // Sent to my roster slot before (or after) I had an account.
    const slot = mySlot
      ? messages.filter(
          (m) => m.toSlot === mySlot && m.fromId !== userId && !(m.readBy || []).includes(userId)
        ).length
      : 0;

    const linkedId = currentUser?.childId || currentUser?.cheerleaderId;
    const myGroupIds =
      userRole === 'coach'
        ? groups.map((g) => g.id)
        : cheerleaders.find((c) => c.id === linkedId)?.groupIds || [];
    const group = messages.filter(
      (m) => m.groupId && myGroupIds.includes(m.groupId) && m.fromId !== userId && !(m.readBy || []).includes(userId)
    ).length;

    // Both thread listeners are already scoped to me, so every thread in
    // state is one I belong to — by uid or by pending roster slot.
    const myThreadIds = customThreads.map((t) => t.id);
    const custom = messages.filter(
      (m) => m.threadId && myThreadIds.includes(m.threadId) && m.fromId !== userId && !(m.readBy || []).includes(userId)
    ).length;

    return direct + slot + group + custom;
  };

  // Categories
  const addMeritCategory = (name, points, icon) =>
    squadApi.addMeritCategory(profile.squadId, name, points, icon, meritCategories.length);
  const addDemeritCategory = (name, points, icon) =>
    squadApi.addDemeritCategory(profile.squadId, name, points, icon, demeritCategories.length);
  const addCategory = (name, points, icon, isMerit) =>
    isMerit
      ? squadApi.addMeritCategory(profile.squadId, name, points, icon)
      : squadApi.addDemeritCategory(profile.squadId, name, points, icon);
  const updateCategory = (id, updates) => squadApi.updateCategory(profile.squadId, id, updates);
  const deleteCategory = (id) => squadApi.deleteCategory(profile.squadId, id);
  // Rewrites the whole list's order rather than swapping two values, so
  // categories added before `order` existed get normalized on first move.
  const reorderCategory = (id, direction) => {
    const isMerit = meritCategories.some((c) => c.id === id);
    const list = isMerit ? meritCategories : demeritCategories;
    const index = list.findIndex((c) => c.id === id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= list.length) return Promise.resolve();

    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return Promise.all(next.map((c, i) => squadApi.reorderCategory(profile.squadId, c.id, i)));
  };

  const loadPresetPack = async (packId, mode) => {
    const pack = presetPacks.find((p) => p.id === packId);
    if (!pack) return { added: 0, removed: 0 };
    const removed = mode === 'replace' ? meritCategories.length + demeritCategories.length : 0;
    await squadApi.loadPresetPack(profile.squadId, pack, mode === 'replace');
    return { added: pack.categories.length, removed };
  };

  const regenerateParentCode = (cheerleaderId, name) =>
    squadApi.regenerateParentCode(profile.squadId, cheerleaderId, name);

  const getTodayPointTotal = (cheerleaderId) => {
    const today = new Date().toDateString();
    return pointHistory
      .filter((p) => p.cheerleaderId === cheerleaderId && new Date(p.timestamp).toDateString() === today)
      .reduce((sum, p) => sum + p.points, 0);
  };

  // Groups
  const addGroup = (name, icon, color) => squadApi.addGroup(profile.squadId, name, icon, color);
  const updateGroup = (id, updates) => squadApi.updateGroup(profile.squadId, id, updates);
  const deleteGroup = (id) => squadApi.deleteGroup(profile.squadId, id);
  const setCheerleaderGroups = (cheerleaderId, groupIds) =>
    squadApi.setCheerleaderGroups(profile.squadId, cheerleaderId, groupIds);
  const setGroupMembers = (groupId, memberIds) =>
    squadApi.setGroupMembers(profile.squadId, groupId, memberIds);
  const getGroupMembers = (groupId) => cheerleaders.filter((c) => (c.groupIds || []).includes(groupId));
  const getGroupsFor = (cheerleaderId) => {
    const cheerleader = cheerleaders.find((c) => c.id === cheerleaderId);
    if (!cheerleader) return [];
    return groups.filter((g) => (cheerleader.groupIds || []).includes(g.id));
  };

  // Reward tiers
  const addRewardTier = (name, icon, threshold) => squadApi.addRewardTier(profile.squadId, name, icon, threshold);
  const updateRewardTier = (id, updates) => squadApi.updateRewardTier(profile.squadId, id, updates);
  const deleteRewardTier = (id) => squadApi.deleteRewardTier(profile.squadId, id);
  // rewardTiers is threshold-ascending, so the last one at or below `points` wins.
  const getTierForPoints = (points) =>
    rewardTiers.reduce((best, tier) => (points >= tier.threshold ? tier : best), null);
  const getNextTier = (points) => {
    const total = Number(points) || 0;
    const next = rewardTiers.find((tier) => total < tier.threshold);
    return next ? { tier: next, pointsAway: next.threshold - total } : null;
  };

  // Rules
  const squadRules = { ...defaultSquadRules, ...(squad?.rules || {}) };
  // Takes a partial patch so callers can flip one setting without restating the rest.
  const updateSquadRules = (patch) =>
    squadApi.updateSquadRules(profile.squadId, {
      ...squadRules,
      ...patch,
      dailyPointCap: Math.max(0, Number(patch.dailyPointCap ?? squadRules.dailyPointCap) || 0),
    });

  // Seasons
  const currentSeason = squad?.currentSeason || null;

  // Snapshots the standings before the reset, so an archived season stays
  // browsable even though live totals go back to zero.
  const startNewSeason = (seasonName) => {
    const standings = [...cheerleaders]
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .map((c) => ({
        cheerleaderId: c.id,
        name: c.name,
        avatar: c.avatar,
        totalPoints: c.totalPoints || 0,
        tierName: getTierForPoints(c.totalPoints || 0)?.name || null,
      }));
    const name = (seasonName || '').trim() || `Season ${seasons.length + 2}`;
    return squadApi.startNewSeason(profile.squadId, name, standings);
  };
  const getSeasonEntries = (seasonId) => squadApi.getSeasonEntries(profile.squadId, seasonId);
  const deleteArchivedSeason = (seasonId) => squadApi.deleteArchivedSeason(profile.squadId, seasonId);

  const value = {
    // Auth/session state
    sessionLoading,
    currentUser,
    userRole,
    squad,

    // Data
    cheerleaders,
    pointHistory,
    meritCategories,
    demeritCategories,
    pointCategories,
    announcements,
    messages,
    groups,
    rewardTiers,
    seasons,
    squadRules,
    currentSeason,
    events,
    members,
    customThreads,

    // Auth actions
    signUpCoach,
    joinAsCoach,
    signUpCheerleaderAccount,
    signUpParentAccount,
    signIn,
    logout,

    // Squad join helpers (re-exported for screens)
    resolveInviteCode: squadApi.resolveInviteCode,
    resolveCoachInviteCode: squadApi.resolveCoachInviteCode,
    listCheerleaders: squadApi.listCheerleaders,
    findCheerleaderByParentCode: squadApi.findCheerleaderByParentCode,

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

    // Announcements
    addAnnouncement,
    removeAnnouncement,

    // Team calendar
    addEvent,
    updateEvent,
    removeEvent,

    // Messages
    sendMessage,
    getMessagesForUser,
    markMessageAsRead,
    markThreadAsRead,
    mySlot,
    sendSlotMessage,
    markPersonThreadAsRead,
    getUnreadCount,
    sendGroupMessage,
    markGroupThreadAsRead,
    createCustomThread,
    sendThreadMessage,
    markCustomThreadAsRead,

    // Categories
    addMeritCategory,
    addDemeritCategory,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
