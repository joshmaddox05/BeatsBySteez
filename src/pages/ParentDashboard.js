import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import RecentActivity from '../components/RecentActivity';
import AnnouncementSection from '../components/AnnouncementSection';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    cheerleaders,
    getCheerleaderHistory,
    sendMessage,
    getMessagesForUser
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [messageContent, setMessageContent] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get child's data
  const childId = currentUser?.childId;
  const childData = cheerleaders.find(c => c.id === childId);
  const childHistory = getCheerleaderHistory(childId || '');

  // Get messages
  const myMessages = getMessagesForUser(currentUser?.id || '');

  // Calculate stats
  const totalMerits = childHistory.filter(h => h.isMerit).reduce((sum, h) => sum + h.points, 0);
  const totalDemerits = childHistory.filter(h => !h.isMerit).reduce((sum, h) => sum + h.points, 0);

  // This week stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekHistory = childHistory.filter(h => new Date(h.timestamp) >= weekAgo);
  const weeklyChange = thisWeekHistory.reduce((sum, h) => sum + h.points, 0);

  // Get ranking
  const sortedCheerleaders = [...cheerleaders].sort((a, b) => b.totalPoints - a.totalPoints);
  const childRank = sortedCheerleaders.findIndex(c => c.id === childId) + 1;

  // Handle sending message to coach
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageContent.trim()) {
      sendMessage('coach', messageContent.trim());
      setMessageContent('');
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 3000);
    }
  };

  if (!childData) {
    return (
      <div className="dashboard error-state">
        <p>Could not find your child's profile. Please log in again.</p>
        <button onClick={handleLogout}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="dashboard parent-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📣 Cheer Merit Tracker</h1>
          <span className="user-info">Parent Portal</span>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="child-profile-hero">
        <div className="hero-avatar">{childData.avatar}</div>
        <h2>{childData.name}'s Progress</h2>
        <div className="hero-stats">
          <div className="stat-item total">
            <span className="stat-value">{childData.totalPoints}</span>
            <span className="stat-label">Total Points</span>
          </div>
          <div className="stat-item rank">
            <span className="stat-value">#{childRank}</span>
            <span className="stat-label">Squad Rank</span>
          </div>
          <div className="stat-item weekly">
            <span className={`stat-value ${weeklyChange >= 0 ? 'positive' : 'negative'}`}>
              {weeklyChange >= 0 ? '+' : ''}{weeklyChange}
            </span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Full History
        </button>
        <button
          className={`nav-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements
        </button>
        <button
          className={`nav-tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          ✉️ Contact Coach
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card merits">
                <h3>Total Merits Earned</h3>
                <span className="value positive">+{totalMerits}</span>
                <p>{childHistory.filter(h => h.isMerit).length} merit awards</p>
              </div>
              <div className="stat-card demerits">
                <h3>Total Demerits</h3>
                <span className="value negative">{totalDemerits}</span>
                <p>{childHistory.filter(h => !h.isMerit).length} demerit records</p>
              </div>
            </div>

            <div className="section-card">
              <h3>Recent Activity</h3>
              <RecentActivity
                history={childHistory.slice(0, 10)}
                cheerleaders={cheerleaders}
                limit={10}
              />
            </div>

            <div className="section-card breakdown">
              <h3>Points Breakdown</h3>
              <div className="breakdown-chart">
                <div className="breakdown-bar">
                  <div
                    className="merits-bar"
                    style={{ width: totalMerits > 0 ? `${(totalMerits / (totalMerits + Math.abs(totalDemerits))) * 100}%` : '0%' }}
                  >
                    {totalMerits > 0 && `+${totalMerits}`}
                  </div>
                  <div
                    className="demerits-bar"
                    style={{ width: totalDemerits < 0 ? `${(Math.abs(totalDemerits) / (totalMerits + Math.abs(totalDemerits))) * 100}%` : '0%' }}
                  >
                    {totalDemerits < 0 && totalDemerits}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <h2>Complete History</h2>
            <RecentActivity
              history={childHistory}
              cheerleaders={cheerleaders}
              limit={100}
            />
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            <h2>📢 Team Announcements</h2>
            <AnnouncementSection isCoach={false} />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="contact-section">
            <h2>✉️ Message the Coach</h2>

            {messageSent && (
              <div className="success-message">
                ✅ Message sent successfully!
              </div>
            )}

            <form className="message-form" onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Your Message</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Write a message to the coach..."
                  rows={5}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">
                Send Message
              </button>
            </form>

            <div className="messages-history">
              <h3>Message History</h3>
              {myMessages.length === 0 ? (
                <p className="no-messages">No messages yet.</p>
              ) : (
                <ul className="messages-list">
                  {myMessages.map((msg) => (
                    <li
                      key={msg.id}
                      className={`message-item ${msg.fromId === currentUser?.id ? 'sent' : 'received'}`}
                    >
                      <div className="message-header">
                        <span className="from">{msg.fromName}</span>
                        <span className="time">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="message-content">{msg.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;
