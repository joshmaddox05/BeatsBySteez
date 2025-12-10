import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  defaultMeritCategories,
  defaultDemeritCategories,
  sampleCheerleaders
} from '../data/defaultCategories';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'coach', 'cheerleader', 'parent'

  // Data state
  const [cheerleaders, setCheerleaders] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [meritCategories, setMeritCategories] = useState(defaultMeritCategories);
  const [demeritCategories, setDemeritCategories] = useState(defaultDemeritCategories);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCheerleaders = localStorage.getItem('cheerleaders');
    const savedHistory = localStorage.getItem('pointHistory');
    const savedAnnouncements = localStorage.getItem('announcements');
    const savedMessages = localStorage.getItem('messages');
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');

    if (savedCheerleaders) {
      setCheerleaders(JSON.parse(savedCheerleaders));
    } else {
      // Initialize with sample data
      setCheerleaders(sampleCheerleaders);
      localStorage.setItem('cheerleaders', JSON.stringify(sampleCheerleaders));
    }

    if (savedHistory) {
      setPointHistory(JSON.parse(savedHistory));
    }

    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    }

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedUser && savedRole) {
      setCurrentUser(JSON.parse(savedUser));
      setUserRole(savedRole);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (cheerleaders.length > 0) {
      localStorage.setItem('cheerleaders', JSON.stringify(cheerleaders));
    }
  }, [cheerleaders]);

  useEffect(() => {
    localStorage.setItem('pointHistory', JSON.stringify(pointHistory));
  }, [pointHistory]);

  useEffect(() => {
    localStorage.setItem('announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  // Auth functions
  const loginAsCoach = (name) => {
    const user = { id: 'coach', name, role: 'coach' };
    setCurrentUser(user);
    setUserRole('coach');
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('userRole', 'coach');
  };

  const loginAsCheerleader = (cheerleaderId) => {
    const cheerleader = cheerleaders.find(c => c.id === cheerleaderId);
    if (cheerleader) {
      const user = { ...cheerleader, role: 'cheerleader' };
      setCurrentUser(user);
      setUserRole('cheerleader');
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('userRole', 'cheerleader');
      return true;
    }
    return false;
  };

  const loginAsParent = (parentCode) => {
    const cheerleader = cheerleaders.find(c => c.parentCode === parentCode);
    if (cheerleader) {
      const user = { id: `parent-${cheerleader.id}`, name: `${cheerleader.name}'s Parent`, childId: cheerleader.id, role: 'parent' };
      setCurrentUser(user);
      setUserRole('parent');
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('userRole', 'parent');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  };

  // Cheerleader management
  const addCheerleader = (name, avatar) => {
    const newCheerleader = {
      id: uuidv4(),
      name,
      avatar,
      parentCode: `${name.split(' ')[0].toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
      totalPoints: 0
    };
    setCheerleaders(prev => [...prev, newCheerleader]);
    return newCheerleader;
  };

  const updateCheerleader = (id, updates) => {
    setCheerleaders(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const removeCheerleader = (id) => {
    setCheerleaders(prev => prev.filter(c => c.id !== id));
    setPointHistory(prev => prev.filter(p => p.cheerleaderId !== id));
  };

  // Point management
  const awardPoints = (cheerleaderId, category, ismerit, note = '') => {
    const timestamp = new Date().toISOString();
    const pointEntry = {
      id: uuidv4(),
      cheerleaderId,
      category,
      points: category.points,
      isMerit: ismerit,
      note,
      timestamp,
      awardedBy: currentUser?.name || 'Coach'
    };

    setPointHistory(prev => [pointEntry, ...prev]);

    // Update cheerleader's total points
    setCheerleaders(prev =>
      prev.map(c =>
        c.id === cheerleaderId
          ? { ...c, totalPoints: c.totalPoints + category.points }
          : c
      )
    );

    return pointEntry;
  };

  const removePointEntry = (entryId) => {
    const entry = pointHistory.find(p => p.id === entryId);
    if (entry) {
      setPointHistory(prev => prev.filter(p => p.id !== entryId));
      setCheerleaders(prev =>
        prev.map(c =>
          c.id === entry.cheerleaderId
            ? { ...c, totalPoints: c.totalPoints - entry.points }
            : c
        )
      );
    }
  };

  // Get history for a specific cheerleader
  const getCheerleaderHistory = (cheerleaderId) => {
    return pointHistory.filter(p => p.cheerleaderId === cheerleaderId);
  };

  // Announcements
  const addAnnouncement = (title, content) => {
    const announcement = {
      id: uuidv4(),
      title,
      content,
      timestamp: new Date().toISOString(),
      author: currentUser?.name || 'Coach'
    };
    setAnnouncements(prev => [announcement, ...prev]);
    return announcement;
  };

  const removeAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Messages
  const sendMessage = (toId, content) => {
    const message = {
      id: uuidv4(),
      fromId: currentUser?.id,
      fromName: currentUser?.name,
      fromRole: userRole,
      toId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [message, ...prev]);
    return message;
  };

  const getMessagesForUser = (userId) => {
    return messages.filter(m => m.toId === userId || m.fromId === userId);
  };

  const markMessageAsRead = (messageId) => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, read: true } : m)
    );
  };

  // Custom categories
  const addMeritCategory = (name, points, icon) => {
    const category = { id: uuidv4(), name, points, icon };
    setMeritCategories(prev => [...prev, category]);
    return category;
  };

  const addDemeritCategory = (name, points, icon) => {
    const category = { id: uuidv4(), name, points: -Math.abs(points), icon };
    setDemeritCategories(prev => [...prev, category]);
    return category;
  };

  // Reset data (for demo purposes)
  const resetToDemo = () => {
    setCheerleaders(sampleCheerleaders);
    setPointHistory([]);
    setAnnouncements([]);
    setMessages([]);
    setMeritCategories(defaultMeritCategories);
    setDemeritCategories(defaultDemeritCategories);
    localStorage.setItem('cheerleaders', JSON.stringify(sampleCheerleaders));
    localStorage.removeItem('pointHistory');
    localStorage.removeItem('announcements');
    localStorage.removeItem('messages');
  };

  const value = {
    // State
    currentUser,
    userRole,
    cheerleaders,
    pointHistory,
    meritCategories,
    demeritCategories,
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

    // Utility
    resetToDemo
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
