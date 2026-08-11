import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import * as authApi from '../firebase/auth';
import * as squadApi from '../firebase/squad';

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
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMeritCategories(all.filter((c) => c.isMerit));
      setDemeritCategories(all.filter((c) => !c.isMerit));
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

    return () => {
      unsubCheerleaders();
      unsubHistory();
      unsubCategories();
      unsubAnnouncements();
      unsubMessages();
    };
  }, [profile?.squadId]);

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

  const userRole = profile?.role || null;
  const sessionLoading = authLoading || (!!firebaseUser && profile === undefined);

  // Auth actions
  const signUpCoach = (email, password, displayName, squadName) =>
    authApi.signUpCoach(email, password, displayName, squadName);

  const signUpCheerleaderAccount = (email, password, displayName, squadId, linkedCheerleaderId) =>
    authApi.signUpCheerleader(email, password, displayName, squadId, linkedCheerleaderId);

  const signUpParentAccount = (email, password, displayName, squadId, linkedCheerleaderId) =>
    authApi.signUpParent(email, password, displayName, squadId, linkedCheerleaderId);

  const signIn = (email, password) => authApi.signIn(email, password);

  const logout = () => authApi.logout();

  // Cheerleader management
  const addCheerleader = (name, avatar) => squadApi.addCheerleader(profile.squadId, name, avatar);
  const updateCheerleader = (id, updates) => squadApi.updateCheerleader(profile.squadId, id, updates);
  const removeCheerleader = (id) => squadApi.removeCheerleader(profile.squadId, id);

  // Points
  const awardPoints = (cheerleaderId, category, isMerit, note = '') =>
    squadApi.awardPoints(profile.squadId, cheerleaderId, category, isMerit, note, firebaseUser.uid, profile.displayName);

  const removePointEntry = (entryId) => squadApi.removePointEntry(profile.squadId, entryId);

  const getCheerleaderHistory = (cheerleaderId) => pointHistory.filter((p) => p.cheerleaderId === cheerleaderId);

  // Announcements
  const addAnnouncement = (title, content) =>
    squadApi.addAnnouncement(profile.squadId, title, content, firebaseUser.uid, profile.displayName);
  const removeAnnouncement = (id) => squadApi.removeAnnouncement(profile.squadId, id);

  // Messages
  const sendMessage = (toId, content) =>
    squadApi.sendMessage(profile.squadId, firebaseUser.uid, profile.displayName, profile.role, toId, content);
  const getMessagesForUser = (userId) => messages.filter((m) => m.toId === userId || m.fromId === userId);
  const markMessageAsRead = (messageId) => squadApi.markMessageAsRead(profile.squadId, messageId);

  // Categories
  const addMeritCategory = (name, points, icon) => squadApi.addMeritCategory(profile.squadId, name, points, icon);
  const addDemeritCategory = (name, points, icon) => squadApi.addDemeritCategory(profile.squadId, name, points, icon);

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
    announcements,
    messages,

    // Auth actions
    signUpCoach,
    signUpCheerleaderAccount,
    signUpParentAccount,
    signIn,
    logout,

    // Squad join helpers (re-exported for screens)
    resolveInviteCode: squadApi.resolveInviteCode,
    listCheerleaders: squadApi.listCheerleaders,
    findCheerleaderByParentCode: squadApi.findCheerleaderByParentCode,

    // Cheerleader management
    addCheerleader,
    updateCheerleader,
    removeCheerleader,

    // Points
    awardPoints,
    removePointEntry,
    getCheerleaderHistory,

    // Announcements
    addAnnouncement,
    removeAnnouncement,

    // Messages
    sendMessage,
    getMessagesForUser,
    markMessageAsRead,

    // Categories
    addMeritCategory,
    addDemeritCategory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
