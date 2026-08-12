import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import RecentActivity from '../components/RecentActivity';
import AnnouncementSection from '../components/AnnouncementSection';
import TierBadge from '../components/TierBadge';
import TierProgress from '../components/TierProgress';

const CheerleaderDashboard = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    cheerleaders,
    getCheerleaderHistory,
    currentSeason
  } = useApp();

  const [activeTab, setActiveTab] = useState('myProgress');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get current cheerleader data
  const myData = cheerleaders.find(c => c.id === currentUser?.id);
  const myHistory = getCheerleaderHistory(currentUser?.id || '');
  // Totals shown next to "Total Points" have to cover the same span that
  // totalPoints does, or a season reset leaves them contradicting each other.
  const seasonHistory = myHistory.filter(h => h.seasonId === currentSeason.id);

  // Calculate stats
  const totalMerits = seasonHistory.filter(h => h.isMerit).reduce((sum, h) => sum + (h.points || 0), 0);
  const totalDemerits = seasonHistory.filter(h => !h.isMerit).reduce((sum, h) => sum + (h.points || 0), 0);
  const thisWeekHistory = seasonHistory.filter(h => {
    const entryDate = new Date(h.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });
  const weekChange = thisWeekHistory.reduce((sum, h) => sum + (h.points || 0), 0);

  // Get ranking
  const sortedCheerleaders = [...cheerleaders].sort(
    (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)
  );
  const myRank = sortedCheerleaders.findIndex(c => c.id === currentUser?.id) + 1;

  if (!myData) {
    return (
      <div className="dashboard error-state">
        <p>Could not find your profile. Please log in again.</p>
        <button onClick={handleLogout}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="dashboard cheerleader-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📣 Cheer Merit Tracker</h1>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <span className="avatar">{myData.avatar}</span>
            <span className="name">{myData.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="profile-hero">
        <div className="hero-avatar">{myData.avatar}</div>
        <h2>{myData.name}</h2>
        <TierProgress points={myData.totalPoints ?? 0} />
        <div className="hero-stats">
          <div className="stat-item total">
            <span className="stat-value">{myData.totalPoints ?? 0}</span>
            <span className="stat-label">Total Points</span>
          </div>
          <div className="stat-item rank">
            <span className="stat-value">#{myRank}</span>
            <span className="stat-label">Squad Rank</span>
          </div>
          <div className="stat-item merits">
            <span className="stat-value positive">+{totalMerits}</span>
            <span className="stat-label">Merits Earned</span>
          </div>
          <div className="stat-item demerits">
            <span className="stat-value negative">{totalDemerits}</span>
            <span className="stat-label">Demerits</span>
          </div>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'myProgress' ? 'active' : ''}`}
          onClick={() => setActiveTab('myProgress')}
        >
          📊 My Progress
        </button>
        <button
          className={`nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Leaderboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'myProgress' && (
          <div className="progress-section">
            <div className="section-card">
              <h3>This Week</h3>
              <div className="week-summary">
                <p>
                  <strong>{thisWeekHistory.length}</strong> point actions this week
                </p>
                <p>
                  Points change:{' '}
                  <span className={weekChange >= 0 ? 'positive' : 'negative'}>
                    {weekChange >= 0 ? '+' : ''}
                    {weekChange}
                  </span>
                </p>
              </div>
            </div>

            <div className="section-card">
              <h3>My Activity History</h3>
              <RecentActivity
                history={myHistory}
                cheerleaders={cheerleaders}
                limit={20}
              />
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h2>🏆 Squad Leaderboard</h2>
            <div className="leaderboard">
              {sortedCheerleaders.map((cheerleader, index) => (
                <div
                  key={cheerleader.id}
                  className={`leaderboard-item rank-${index + 1} ${cheerleader.id === currentUser?.id ? 'is-me' : ''}`}
                >
                  <span className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </span>
                  <span className="avatar">{cheerleader.avatar}</span>
                  <span className="name">
                    {cheerleader.name}
                    {cheerleader.id === currentUser?.id && ' (You)'}
                    <TierBadge points={cheerleader.totalPoints ?? 0} size="sm" />
                  </span>
                  <span className={`points ${(cheerleader.totalPoints ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(cheerleader.totalPoints ?? 0) >= 0 ? '+' : ''}{cheerleader.totalPoints ?? 0} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            <h2>📢 Team Announcements</h2>
            <AnnouncementSection isCoach={false} />
          </div>
        )}
      </main>
    </div>
  );
};

export default CheerleaderDashboard;
