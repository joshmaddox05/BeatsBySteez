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
import { defaultMeritCategories, defaultDemeritCategories } from '../data/defaultCategories';

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
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);
  defaultMeritCategories.forEach((category) => {
    const ref = doc(collection(db, 'squads', squadRef.id, 'categories'));
    batch.set(ref, { ...category, isMerit: true });
  });
  defaultDemeritCategories.forEach((category) => {
    const ref = doc(collection(db, 'squads', squadRef.id, 'categories'));
    batch.set(ref, { ...category, isMerit: false });
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
