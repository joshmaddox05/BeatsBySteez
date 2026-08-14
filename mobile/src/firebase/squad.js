import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { defaultMeritCategories, defaultDemeritCategories, defaultSquadRules } from '../data/defaultCategories';
import { buildDefaultGroups } from '../data/defaultGroups';
import { defaultRewardTiers } from '../data/defaultRewardTiers';

// Bump when a new default collection or squad field is introduced, so existing
// squads pick it up on next load.
const SQUAD_DEFAULTS_VERSION = 3;

const randomInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const randomParentCode = (name) => {
  const first = (name.split(' ')[0] || 'CHEER').toUpperCase().replace(/[^A-Z]/g, '');
  return `${first}${Math.floor(1000 + Math.random() * 9000)}`;
};

// Public roster of every signed-up participant in a squad (coach, parents,
// cheerleaders), used to build the "message these people" picker. Separate
// from `users/{uid}` (which only its owner can read) and from `coaches/{uid}`
// (which is auth-only, not a display roster).
export const addMember = (squadId, uid, role, displayName, linkedCheerleaderId = null) =>
  setDoc(doc(db, 'squads', squadId, 'members', uid), {
    uid,
    role,
    displayName,
    linkedCheerleaderId,
    joinedAt: serverTimestamp(),
  });

// Accounts created before the members roster existed (or that missed the
// write for any other reason) never got a members/{uid} doc, so they're
// invisible in the "message these people" picker. Every signed-in user's own
// client self-heals its own doc on load — nobody else can write it for them,
// since the rule only allows request.auth.uid == uid.
export const ensureOwnMemberDoc = async (squadId, uid, role, displayName, linkedCheerleaderId) => {
  const ref = doc(db, 'squads', squadId, 'members', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await addMember(squadId, uid, role, displayName, linkedCheerleaderId || null);
};

export const createSquad = async (coachUid, squadName, displayName) => {
  const squadRef = doc(collection(db, 'squads'));
  const inviteCode = randomInviteCode();
  const coachInviteCode = randomInviteCode();

  await setDoc(squadRef, {
    name: squadName,
    coachId: coachUid,
    inviteCode,
    coachInviteCode,
    rules: defaultSquadRules,
    currentSeason: { id: `season-${Date.now()}`, name: 'Season 1', startedAt: new Date().toISOString() },
    defaultsVersion: SQUAD_DEFAULTS_VERSION,
    createdAt: serverTimestamp(),
  });

  // Two separate writes, not one batch: the coaches/{uid} create rule reads
  // squads/{squadId}.coachId via get(), and get() inside a rule only sees
  // already-committed data — it can't see another write in the same batch.
  await setDoc(doc(db, 'squads', squadRef.id, 'coaches', coachUid), {
    uid: coachUid,
    joinedAt: serverTimestamp(),
  });
  await addMember(squadRef.id, coachUid, 'coach', displayName);

  const batch = writeBatch(db);
  defaultMeritCategories.forEach((category, i) => {
    const ref = doc(collection(db, 'squads', squadRef.id, 'categories'));
    batch.set(ref, { ...category, isMerit: true, order: i });
  });
  defaultDemeritCategories.forEach((category, i) => {
    const ref = doc(collection(db, 'squads', squadRef.id, 'categories'));
    batch.set(ref, { ...category, isMerit: false, order: i });
  });
  buildDefaultGroups().forEach((group) => {
    const { id, ...rest } = group;
    batch.set(doc(db, 'squads', squadRef.id, 'groups', id), rest);
  });
  defaultRewardTiers.forEach((tier) => {
    const { id, ...rest } = tier;
    batch.set(doc(db, 'squads', squadRef.id, 'rewardTiers', id), rest);
  });
  await batch.commit();

  return { squadId: squadRef.id, inviteCode, coachInviteCode };
};

// An assistant coach joins an existing squad. The coaches/{uid} create rule
// only allows this when `coachInviteCode` matches what's stored on the squad
// doc, so knowing the squad's id alone isn't enough to grant coach access.
export const resolveCoachInviteCode = async (coachInviteCode) => {
  const q = query(
    collection(db, 'squads'),
    where('coachInviteCode', '==', coachInviteCode.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const joinSquadAsCoach = async (squadId, uid, coachInviteCode, displayName) => {
  await setDoc(doc(db, 'squads', squadId, 'coaches', uid), {
    uid,
    inviteCode: coachInviteCode.trim().toUpperCase(),
    joinedAt: serverTimestamp(),
  });
  await addMember(squadId, uid, 'coach', displayName);
};

// Squads created before groups/tiers/seasons/coaches existed have none of
// those docs. Backfills them once, guarded by defaultsVersion so a coach
// opening the app on two devices cannot seed twice.
//
// `coachDisplayName` backfills the legacy coach's own member roster entry —
// pass the signed-in coach's own profile name, since this only ever runs as
// that coach and nothing else can read it back out of `users/{uid}`.
export const ensureSquadDefaults = async (squadId, coachDisplayName) => {
  const squadRef = doc(db, 'squads', squadId);
  const squadSnap = await getDoc(squadRef);
  if (!squadSnap.exists()) return;

  const data = squadSnap.data();
  if ((data.defaultsVersion || 0) >= SQUAD_DEFAULTS_VERSION) return;

  // Must happen before the batch below: until coaches/{coachId} exists,
  // isCoachOfSquad() is false and the squad-doc update in the batch (rules:
  // isCoachOfSquad) would be rejected. The bootstrap branch of the
  // coaches/{uid} create rule (squad.coachId == request.auth.uid) doesn't
  // depend on that, so it's always available to the real founding coach.
  const coachDocSnap = await getDoc(doc(db, 'squads', squadId, 'coaches', data.coachId));
  if (!coachDocSnap.exists()) {
    await setDoc(doc(db, 'squads', squadId, 'coaches', data.coachId), {
      uid: data.coachId,
      joinedAt: serverTimestamp(),
    });
  }
  await addMember(squadId, data.coachId, 'coach', coachDisplayName || 'Coach');

  const [groupsSnap, tiersSnap] = await Promise.all([
    getDocs(collection(db, 'squads', squadId, 'groups')),
    getDocs(collection(db, 'squads', squadId, 'rewardTiers')),
  ]);

  const batch = writeBatch(db);

  if (groupsSnap.empty) {
    buildDefaultGroups().forEach((group) => {
      const { id, ...rest } = group;
      batch.set(doc(db, 'squads', squadId, 'groups', id), rest);
    });
  }

  if (tiersSnap.empty) {
    defaultRewardTiers.forEach((tier) => {
      const { id, ...rest } = tier;
      batch.set(doc(db, 'squads', squadId, 'rewardTiers', id), rest);
    });
  }

  const patch = { defaultsVersion: SQUAD_DEFAULTS_VERSION };
  if (!data.rules) patch.rules = defaultSquadRules;
  if (!data.currentSeason) {
    patch.currentSeason = {
      id: `season-${Date.now()}`,
      name: 'Season 1',
      startedAt: new Date().toISOString(),
    };
  }
  if (!data.coachInviteCode) patch.coachInviteCode = randomInviteCode();
  batch.set(squadRef, patch, { merge: true });

  await batch.commit();
};

export const resolveInviteCode = async (inviteCode) => {
  const q = query(collection(db, 'squads'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const listCheerleaders = async (squadId) => {
  const snap = await getDocs(collection(db, 'squads', squadId, 'cheerleaders'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const findCheerleaderByParentCode = async (squadId, parentCode) => {
  const q = query(
    collection(db, 'squads', squadId, 'cheerleaders'),
    where('parentCode', '==', parentCode.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const addCheerleader = async (squadId, name, avatar, extras = {}) => {
  const ref = doc(collection(db, 'squads', squadId, 'cheerleaders'));
  const cheerleader = {
    name,
    avatar,
    position: extras.position || '',
    notes: extras.notes || '',
    groupIds: extras.groupIds || [],
    parentCode: randomParentCode(name),
    totalPoints: 0,
    lifetimePoints: 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, cheerleader);
  return { id: ref.id, ...cheerleader };
};

export const updateCheerleader = (squadId, cheerleaderId, updates) =>
  setDoc(doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId), updates, { merge: true });

export const removeCheerleader = async (squadId, cheerleaderId) => {
  await deleteDoc(doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId));
  const q = query(
    collection(db, 'squads', squadId, 'pointHistory'),
    where('cheerleaderId', '==', cheerleaderId)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

// `points` is the rule-adjusted value from evaluateAward, which can differ from
// category.points when a daily cap or the zero floor trims the award.
export const awardPoints = async (
  squadId,
  cheerleaderId,
  category,
  isMerit,
  note,
  awardedByUid,
  awardedByName,
  points,
  seasonId
) => {
  const applied = points === undefined ? category.points : points;
  const entryRef = doc(collection(db, 'squads', squadId, 'pointHistory'));
  const entry = {
    cheerleaderId,
    category,
    points: applied,
    isMerit,
    note: note || '',
    timestamp: serverTimestamp(),
    awardedByUid,
    awardedByName,
    seasonId: seasonId || null,
  };

  const batch = writeBatch(db);
  batch.set(entryRef, entry);
  batch.set(
    doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId),
    {
      totalPoints: increment(applied),
      lifetimePoints: increment(Math.max(0, applied)),
    },
    { merge: true }
  );
  await batch.commit();

  return { id: entryRef.id, ...entry };
};

export const removePointEntry = async (squadId, entryId) => {
  const entrySnap = await getDoc(doc(db, 'squads', squadId, 'pointHistory', entryId));
  if (!entrySnap.exists()) return;
  const entry = entrySnap.data();

  const batch = writeBatch(db);
  batch.delete(doc(db, 'squads', squadId, 'pointHistory', entryId));
  batch.set(
    doc(db, 'squads', squadId, 'cheerleaders', entry.cheerleaderId),
    { totalPoints: increment(-entry.points) },
    { merge: true }
  );
  await batch.commit();
};

export const addAnnouncement = async (squadId, title, content, authorUid, authorName) => {
  const ref = doc(collection(db, 'squads', squadId, 'announcements'));
  const announcement = {
    title,
    content,
    timestamp: serverTimestamp(),
    authorId: authorUid,
    authorName,
  };
  await setDoc(ref, announcement);
  return { id: ref.id, ...announcement };
};

export const removeAnnouncement = (squadId, announcementId) =>
  deleteDoc(doc(db, 'squads', squadId, 'announcements', announcementId));

// Calendar events live in the announcements area but their own subcollection,
// since they have their own shape (date/time/location) instead of free text.
export const addEvent = async (squadId, event, authorUid, authorName) => {
  const ref = doc(collection(db, 'squads', squadId, 'events'));
  const data = {
    title: event.title,
    description: event.description || '',
    date: event.date,
    time: event.time || '',
    location: event.location || '',
    icon: event.icon || '📅',
    authorId: authorUid,
    authorName,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data };
};

export const updateEvent = (squadId, eventId, updates) =>
  setDoc(doc(db, 'squads', squadId, 'events', eventId), updates, { merge: true });

export const removeEvent = (squadId, eventId) =>
  deleteDoc(doc(db, 'squads', squadId, 'events', eventId));

// A "slot" names a person by their place on the roster — which cheerleader,
// and whether it's the athlete herself or her parent — instead of by account
// uid. Coaches can then start a conversation with someone who has not signed
// up yet; whoever links to that roster spot later picks up the whole history.
// Kept in sync with mySlot() in firestore.rules.
export const slotForAudience = (audience, cheerleaderId) => `${audience}:${cheerleaderId}`;

export const slotForRole = (role, cheerleaderId) => {
  if (!cheerleaderId) return null;
  if (role === 'cheerleader') return `athlete:${cheerleaderId}`;
  if (role === 'parent') return `parent:${cheerleaderId}`;
  return null;
};

export const sendMessage = async (squadId, fromId, fromName, fromRole, toId, content) => {
  const ref = doc(collection(db, 'squads', squadId, 'messages'));
  const message = {
    fromId,
    fromName,
    fromRole,
    toId,
    content,
    timestamp: serverTimestamp(),
    read: false,
  };
  await setDoc(ref, message);
  return { id: ref.id, ...message };
};

export const markMessageAsRead = (squadId, messageId) =>
  setDoc(doc(db, 'squads', squadId, 'messages', messageId), { read: true }, { merge: true });

export const markThreadAsRead = async (squadId, myId, otherId) => {
  const q = query(
    collection(db, 'squads', squadId, 'messages'),
    where('toId', '==', myId),
    where('fromId', '==', otherId)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (!d.data().read) batch.set(d.ref, { read: true }, { merge: true });
  });
  await batch.commit();
};

// Addressed to a roster slot rather than a uid. Uses `readBy` instead of a
// boolean `read` because more than one account can link to the same slot (both
// of a cheerleader's parents, say), so "read" has to be tracked per person.
export const sendSlotMessage = async (squadId, fromId, fromName, fromRole, toSlot, content) => {
  const ref = doc(collection(db, 'squads', squadId, 'messages'));
  const message = {
    fromId,
    fromName,
    fromRole,
    toId: null,
    toSlot,
    content,
    timestamp: serverTimestamp(),
    readBy: [fromId],
  };
  await setDoc(ref, message);
  return { id: ref.id, ...message };
};

// Marks an exact set of already-loaded messages as read by me. A person's
// thread can mix both shapes — uid-addressed messages carry a boolean `read`,
// slot-addressed ones carry `readBy`, since several accounts can sit on the
// receiving end of one message — so the shape is decided per message.
export const markMessagesAsRead = async (squadId, messages, myId) => {
  const batch = writeBatch(db);
  let pending = 0;

  messages.forEach((m) => {
    const ref = doc(db, 'squads', squadId, 'messages', m.id);
    if (Array.isArray(m.readBy)) {
      if (m.readBy.includes(myId)) return;
      batch.set(ref, { readBy: arrayUnion(myId) }, { merge: true });
    } else {
      if (m.toId !== myId || m.read) return;
      batch.set(ref, { read: true }, { merge: true });
    }
    pending += 1;
  });

  if (pending === 0) return;
  await batch.commit();
};

// Group threads are keyed off an existing squad group (Varsity, JV, ...)
// rather than a separate collection, so membership always matches whoever
// the coach currently has in that group. Every participant can see who else
// is in the thread has read a message, since a boolean `read` flag can't
// represent "read by some of several recipients".
export const sendGroupMessage = async (squadId, groupId, groupName, fromId, fromName, fromRole, content) => {
  const ref = doc(collection(db, 'squads', squadId, 'messages'));
  const message = {
    fromId,
    fromName,
    fromRole,
    toId: null,
    groupId,
    groupName,
    content,
    timestamp: serverTimestamp(),
    readBy: [fromId],
  };
  await setDoc(ref, message);
  return { id: ref.id, ...message };
};

export const markGroupThreadAsRead = async (squadId, groupId, myId) => {
  const q = query(collection(db, 'squads', squadId, 'messages'), where('groupId', '==', groupId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (!(d.data().readBy || []).includes(myId)) {
      batch.set(d.ref, { readBy: arrayUnion(myId) }, { merge: true });
    }
  });
  await batch.commit();
};

// Custom threads are a hand-picked set of people (any mix of coach, parents,
// cheerleaders) that isn't tied to an existing squad group — the "message
// these specific people" case. `memberNames`/`slotNames` are denormalized onto
// the thread doc so the inbox can render a title without extra reads.
//
// Membership is recorded twice over: `memberIds` for accounts that exist right
// now, and `memberSlots` for the roster spots those people occupy. The read
// rule matches either, so a cheerleader or parent who signs up later — or a
// second parent linking to the same athlete — picks the thread up with its
// backlog intact. `memberSlots` is always written (even empty) so the rule's
// array lookup never hits a missing field.
export const createCustomThread = async (
  squadId,
  creatorUid,
  memberIds,
  memberNames,
  memberSlots = [],
  slotNames = {}
) => {
  const ref = doc(collection(db, 'squads', squadId, 'threads'));
  const data = {
    memberIds: [...new Set([...memberIds, creatorUid])],
    memberNames,
    memberSlots: [...new Set(memberSlots)],
    slotNames,
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data };
};

export const sendThreadMessage = async (squadId, threadId, fromId, fromName, fromRole, content) => {
  const ref = doc(collection(db, 'squads', squadId, 'messages'));
  const message = {
    fromId,
    fromName,
    fromRole,
    toId: null,
    threadId,
    content,
    timestamp: serverTimestamp(),
    readBy: [fromId],
  };
  await setDoc(ref, message);
  return { id: ref.id, ...message };
};

export const markCustomThreadAsRead = async (squadId, threadId, myId) => {
  const q = query(collection(db, 'squads', squadId, 'messages'), where('threadId', '==', threadId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (!(d.data().readBy || []).includes(myId)) {
      batch.set(d.ref, { readBy: arrayUnion(myId) }, { merge: true });
    }
  });
  await batch.commit();
};

export const regenerateParentCode = async (squadId, cheerleaderId, name) => {
  const parentCode = randomParentCode(name);
  await setDoc(
    doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId),
    { parentCode },
    { merge: true }
  );
  return parentCode;
};

// Awards the same category to several cheerleaders in one batch so the roster
// updates in a single Firestore round trip instead of one per cheerleader.
// `awards` is [{ cheerleaderId, points }] — points already rule-adjusted by the
// caller, since the squad rules can trim each cheerleader's award differently.
export const bulkAwardPoints = async (
  squadId,
  awards,
  category,
  isMerit,
  note,
  awardedByUid,
  awardedByName,
  bulkId,
  seasonId
) => {
  if (awards.length === 0) return [];

  const batch = writeBatch(db);
  const entries = [];

  awards.forEach(({ cheerleaderId, points }) => {
    const entryRef = doc(collection(db, 'squads', squadId, 'pointHistory'));
    const entry = {
      cheerleaderId,
      category,
      points,
      isMerit,
      note: note || '',
      timestamp: serverTimestamp(),
      awardedByUid,
      awardedByName,
      bulkId: bulkId || null,
      seasonId: seasonId || null,
    };
    batch.set(entryRef, entry);
    batch.set(
      doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId),
      {
        totalPoints: increment(points),
        lifetimePoints: increment(Math.max(0, points)),
      },
      { merge: true }
    );
    entries.push({ id: entryRef.id, ...entry });
  });

  await batch.commit();
  return entries;
};

export const addGroup = async (squadId, name, icon, color) => {
  const ref = doc(collection(db, 'squads', squadId, 'groups'));
  const group = { name, icon, color, createdAt: new Date().toISOString() };
  await setDoc(ref, group);
  return { id: ref.id, ...group };
};

export const updateGroup = (squadId, groupId, updates) =>
  setDoc(doc(db, 'squads', squadId, 'groups', groupId), updates, { merge: true });

// Deleting a group also strips it from every cheerleader that referenced it,
// so no roster row is left pointing at a group that no longer exists.
export const deleteGroup = async (squadId, groupId) => {
  const snap = await getDocs(collection(db, 'squads', squadId, 'cheerleaders'));
  const batch = writeBatch(db);
  batch.delete(doc(db, 'squads', squadId, 'groups', groupId));
  snap.docs.forEach((d) => {
    const groupIds = d.data().groupIds || [];
    if (groupIds.includes(groupId)) {
      batch.set(d.ref, { groupIds: groupIds.filter((g) => g !== groupId) }, { merge: true });
    }
  });
  await batch.commit();
};

export const setCheerleaderGroups = (squadId, cheerleaderId, groupIds) =>
  setDoc(doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId), { groupIds }, { merge: true });

export const setGroupMembers = async (squadId, groupId, memberIds) => {
  const snap = await getDocs(collection(db, 'squads', squadId, 'cheerleaders'));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    const groupIds = d.data().groupIds || [];
    const shouldBeMember = memberIds.includes(d.id);
    const isMember = groupIds.includes(groupId);
    if (shouldBeMember && !isMember) {
      batch.set(d.ref, { groupIds: [...groupIds, groupId] }, { merge: true });
    } else if (!shouldBeMember && isMember) {
      batch.set(d.ref, { groupIds: groupIds.filter((g) => g !== groupId) }, { merge: true });
    }
  });
  await batch.commit();
};

export const addRewardTier = async (squadId, name, icon, threshold) => {
  const ref = doc(collection(db, 'squads', squadId, 'rewardTiers'));
  const tier = { name, icon, threshold };
  await setDoc(ref, tier);
  return { id: ref.id, ...tier };
};

export const updateRewardTier = (squadId, tierId, updates) =>
  setDoc(doc(db, 'squads', squadId, 'rewardTiers', tierId), updates, { merge: true });

export const deleteRewardTier = (squadId, tierId) =>
  deleteDoc(doc(db, 'squads', squadId, 'rewardTiers', tierId));

export const updateSquadRules = (squadId, rules) =>
  setDoc(doc(db, 'squads', squadId), { rules }, { merge: true });

export const updateCategory = (squadId, categoryId, updates) =>
  setDoc(doc(db, 'squads', squadId, 'categories', categoryId), updates, { merge: true });

export const deleteCategory = (squadId, categoryId) =>
  deleteDoc(doc(db, 'squads', squadId, 'categories', categoryId));

export const reorderCategory = async (squadId, categoryId, newOrder) =>
  setDoc(doc(db, 'squads', squadId, 'categories', categoryId), { order: newOrder }, { merge: true });

// Packs carry no ids: each load mints fresh docs so the same pack can be loaded
// twice and every category stays independently editable afterwards.
export const loadPresetPack = async (squadId, pack, replaceExisting) => {
  const batch = writeBatch(db);

  if (replaceExisting) {
    const existing = await getDocs(collection(db, 'squads', squadId, 'categories'));
    existing.docs.forEach((d) => batch.delete(d.ref));
  }

  pack.categories.forEach((category, i) => {
    const ref = doc(collection(db, 'squads', squadId, 'categories'));
    const isMerit = category.type === 'merit';
    batch.set(ref, {
      name: category.name,
      icon: category.icon,
      points: isMerit ? Math.abs(category.points) : -Math.abs(category.points),
      isMerit,
      order: i,
    });
  });

  await batch.commit();
};

// Ends the current season by copying its point history into an archive, then
// clears live history and resets every running total back to zero.
export const startNewSeason = async (squadId, seasonName, standings) => {
  const squadSnap = await getDoc(doc(db, 'squads', squadId));
  const previous = squadSnap.data()?.currentSeason;

  const historySnap = await getDocs(collection(db, 'squads', squadId, 'pointHistory'));
  const rosterSnap = await getDocs(collection(db, 'squads', squadId, 'cheerleaders'));

  const now = new Date().toISOString();
  const batch = writeBatch(db);

  const archived = previous
    ? {
        ...previous,
        endedAt: now,
        entryCount: historySnap.size,
        standings: standings || [],
      }
    : null;

  if (archived) {
    batch.set(doc(db, 'squads', squadId, 'seasons', previous.id), archived);
    historySnap.docs.forEach((d) => {
      batch.set(doc(db, 'squads', squadId, 'seasons', previous.id, 'entries', d.id), d.data());
    });
  }

  historySnap.docs.forEach((d) => batch.delete(d.ref));
  rosterSnap.docs.forEach((d) => batch.set(d.ref, { totalPoints: 0 }, { merge: true }));

  const current = {
    id: `season-${Date.now()}`,
    name: seasonName,
    startedAt: now,
  };
  batch.set(doc(db, 'squads', squadId), { currentSeason: current }, { merge: true });

  await batch.commit();
  return { archived, current };
};

export const getSeasonEntries = async (squadId, seasonId) => {
  const snap = await getDocs(collection(db, 'squads', squadId, 'seasons', seasonId, 'entries'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteArchivedSeason = async (squadId, seasonId) => {
  const entries = await getDocs(collection(db, 'squads', squadId, 'seasons', seasonId, 'entries'));
  const batch = writeBatch(db);
  entries.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'squads', squadId, 'seasons', seasonId));
  await batch.commit();
};

export const addMeritCategory = async (squadId, name, points, icon, order = 0) => {
  const ref = doc(collection(db, 'squads', squadId, 'categories'));
  const category = { name, points: Math.abs(points), icon, isMerit: true, order };
  await setDoc(ref, category);
  return { id: ref.id, ...category };
};

export const addDemeritCategory = async (squadId, name, points, icon, order = 0) => {
  const ref = doc(collection(db, 'squads', squadId, 'categories'));
  const category = { name, points: -Math.abs(points), icon, isMerit: false, order };
  await setDoc(ref, category);
  return { id: ref.id, ...category };
};
