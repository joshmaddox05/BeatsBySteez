import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { addMember, createSquad, joinSquadAsCoach } from './squad';

export const signUpCoach = async (email, password, displayName, squadName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  const { squadId } = await createSquad(credential.user.uid, squadName, displayName);

  await setDoc(doc(db, 'users', credential.user.uid), {
    role: 'coach',
    squadId,
    displayName,
    email,
    createdAt: serverTimestamp(),
  });

  return credential.user;
};

// A second (assistant) coach joining a squad someone else already created.
// joinSquadAsCoach only succeeds if coachInviteCode matches the squad's own
// coach invite code — see firestore.rules on squads/{squadId}/coaches/{uid}.
export const joinAsCoach = async (email, password, displayName, squadId, coachInviteCode) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  await setDoc(doc(db, 'users', credential.user.uid), {
    role: 'coach',
    squadId,
    displayName,
    email,
    createdAt: serverTimestamp(),
  });

  await joinSquadAsCoach(squadId, credential.user.uid, coachInviteCode, displayName);

  return credential.user;
};

export const signUpCheerleader = async (email, password, displayName, squadId, linkedCheerleaderId) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  await setDoc(doc(db, 'users', credential.user.uid), {
    role: 'cheerleader',
    squadId,
    linkedCheerleaderId,
    displayName,
    email,
    createdAt: serverTimestamp(),
  });
  await addMember(squadId, credential.user.uid, 'cheerleader', displayName, linkedCheerleaderId);

  return credential.user;
};

export const signUpParent = async (email, password, displayName, squadId, linkedCheerleaderId) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  await setDoc(doc(db, 'users', credential.user.uid), {
    role: 'parent',
    squadId,
    linkedCheerleaderId,
    displayName,
    email,
    createdAt: serverTimestamp(),
  });
  await addMember(squadId, credential.user.uid, 'parent', displayName, linkedCheerleaderId);

  return credential.user;
};

export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);
