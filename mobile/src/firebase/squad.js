import {
  addDoc,
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

export const createSquad = async (coachUid, squadName) => {
  const squadRef = doc(collection(db, 'squads'));
  const inviteCode = randomInviteCode();

  await setDoc(squadRef, {
    name: squadName,
    coachId: coachUid,
    inviteCode,
    rules: defaultSquadRules,
    currentSeason: { id: `season-${Date.now()}`, name: 'Season 1', startedAt: new Date().toISOString() },
    createdAt: serverTimestamp(),
  });

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

  return { squadId: squadRef.id, inviteCode };
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

export const addCheerleader = async (squadId, name, avatar) => {
  const ref = doc(collection(db, 'squads', squadId, 'cheerleaders'));
  const cheerleader = {
    name,
    avatar,
    parentCode: randomParentCode(name),
    totalPoints: 0,
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

export const awardPoints = async (squadId, cheerleaderId, category, isMerit, note, awardedByUid, awardedByName) => {
  const entryRef = doc(collection(db, 'squads', squadId, 'pointHistory'));
  const entry = {
    cheerleaderId,
    category,
    points: category.points,
    isMerit,
    note: note || '',
    timestamp: serverTimestamp(),
    awardedByUid,
    awardedByName,
  };

  const batch = writeBatch(db);
  batch.set(entryRef, entry);
  batch.set(
    doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId),
    { totalPoints: increment(category.points) },
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
export const bulkAwardPoints = async (
  squadId,
  cheerleaderIds,
  category,
  isMerit,
  note,
  awardedByUid,
  awardedByName
) => {
  const batch = writeBatch(db);
  const entries = [];

  cheerleaderIds.forEach((cheerleaderId) => {
    const entryRef = doc(collection(db, 'squads', squadId, 'pointHistory'));
    const entry = {
      cheerleaderId,
      category,
      points: category.points,
      isMerit,
      note: note || '',
      timestamp: serverTimestamp(),
      awardedByUid,
      awardedByName,
    };
    batch.set(entryRef, entry);
    batch.set(
      doc(db, 'squads', squadId, 'cheerleaders', cheerleaderId),
      { totalPoints: increment(category.points) },
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
export const startNewSeason = async (squadId, seasonName) => {
  const squadSnap = await getDoc(doc(db, 'squads', squadId));
  const previous = squadSnap.data()?.currentSeason;

  const historySnap = await getDocs(collection(db, 'squads', squadId, 'pointHistory'));
  const rosterSnap = await getDocs(collection(db, 'squads', squadId, 'cheerleaders'));

  const batch = writeBatch(db);

  if (previous) {
    batch.set(doc(db, 'squads', squadId, 'seasons', previous.id), {
      ...previous,
      endedAt: new Date().toISOString(),
      entryCount: historySnap.size,
    });
    historySnap.docs.forEach((d) => {
      batch.set(doc(db, 'squads', squadId, 'seasons', previous.id, 'entries', d.id), d.data());
    });
  }

  historySnap.docs.forEach((d) => batch.delete(d.ref));
  rosterSnap.docs.forEach((d) => batch.set(d.ref, { totalPoints: 0 }, { merge: true }));

  batch.set(
    doc(db, 'squads', squadId),
    {
      currentSeason: {
        id: `season-${Date.now()}`,
        name: seasonName,
        startedAt: new Date().toISOString(),
      },
    },
    { merge: true }
  );

  await batch.commit();
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

export const addMeritCategory = async (squadId, name, points, icon) => {
  const ref = doc(collection(db, 'squads', squadId, 'categories'));
  const category = { name, points, icon, isMerit: true };
  await setDoc(ref, category);
  return { id: ref.id, ...category };
};

export const addDemeritCategory = async (squadId, name, points, icon) => {
  const ref = doc(collection(db, 'squads', squadId, 'categories'));
  const category = { name, points: -Math.abs(points), icon, isMerit: false };
  await setDoc(ref, category);
  return { id: ref.id, ...category };
};
