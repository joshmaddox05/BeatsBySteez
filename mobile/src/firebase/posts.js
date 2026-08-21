import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { deleteMediaFile } from './storage';

export const newPostRef = (squadId) => doc(collection(db, 'squads', squadId, 'announcements'));

export const createPost = async (squadId, postRef, { title, content, authorUid, authorName, media = [] }) => {
  const post = {
    title,
    content,
    timestamp: serverTimestamp(),
    authorId: authorUid,
    authorName,
    media,
    likedBy: [],
    commentCount: 0,
  };
  await setDoc(postRef, post);
  return { id: postRef.id, ...post };
};

// Cascade-deletes the comments subcollection (same pattern as removeCheerleader's
// pointHistory cleanup in squad.js) before deleting the post doc, then best-effort
// removes any attached media from Storage.
export const removePost = async (squadId, postId, media = []) => {
  const commentsSnap = await getDocs(collection(db, 'squads', squadId, 'announcements', postId, 'comments'));
  const batch = writeBatch(db);
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'squads', squadId, 'announcements', postId));
  await batch.commit();

  await Promise.all(media.map((item) => deleteMediaFile(item.storagePath)));
};

export const toggleLike = (squadId, postId, uid, isLiked) =>
  setDoc(
    doc(db, 'squads', squadId, 'announcements', postId),
    { likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid) },
    { merge: true }
  );

export const addComment = async (squadId, postId, { authorId, authorName, authorRole, content, parentCommentId = null }) => {
  const commentRef = doc(collection(db, 'squads', squadId, 'announcements', postId, 'comments'));
  const comment = {
    authorId,
    authorName,
    authorRole,
    content,
    parentCommentId,
    timestamp: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(commentRef, comment);
  batch.set(doc(db, 'squads', squadId, 'announcements', postId), { commentCount: increment(1) }, { merge: true });
  await batch.commit();

  return { id: commentRef.id, ...comment };
};

// Cascade-deletes replies of a top-level comment (single-field query, no
// composite index needed) and decrements commentCount by 1 + reply count.
export const removeComment = async (squadId, postId, commentId) => {
  const repliesSnap = await getDocs(
    query(collection(db, 'squads', squadId, 'announcements', postId, 'comments'), where('parentCommentId', '==', commentId))
  );

  const batch = writeBatch(db);
  batch.delete(doc(db, 'squads', squadId, 'announcements', postId, 'comments', commentId));
  repliesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.set(
    doc(db, 'squads', squadId, 'announcements', postId),
    { commentCount: increment(-(1 + repliesSnap.size)) },
    { merge: true }
  );
  await batch.commit();
};
