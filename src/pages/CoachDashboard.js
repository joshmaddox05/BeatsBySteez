import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import CheerleaderCard from '../components/CheerleaderCard';
import AddCheerleaderModal from '../components/AddCheerleaderModal';
import PointModal from '../components/PointModal';
import AnnouncementSection from '../components/AnnouncementSection';
import RecentActivity from '../components/RecentActivity';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    cheerleaders,
    pointHistory,
    resetToDemo
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCheerleader, setSelectedCheerleader] = useState(null);
  const [pointModalType, setPointModalType] = useState(null); // 'merit' or 'demerit'
  const [activeTab, setActiveTab] = useState('squad');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAwardPoint = (cheerleader, type) => {
    setSelectedCheerleader(cheerleader);
    setPointModalType(type);
  };

  const closePointModal = () => {
    setSelectedCheerleader(null);
    setPointModalType(null);
  };

  // Sort cheerleaders by points (leaderboard)
  const sortedCheerleaders = [...cheerleaders].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="dashboard coach-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📣 Cheer Merit Tracker</h1>
          <span className="user-info">Welcome, Coach {currentUser?.name}!</span>
        </div>
        <div className="header-right">
          <button className="reset-btn" onClick={resetToDemo}>
            Reset Demo
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'squad' ? 'active' : ''}`}
          onClick={() => setActiveTab('squad')}
        >
          👥 My Squad
        </button>
        <button
          className={`nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Leaderboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📋 Activity
        </button>
        <button
          className={`nav-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'squad' && (
          <div className="squad-section">
            <div className="section-header">
              <h2>My Squad ({cheerleaders.length} cheerleaders)</h2>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                + Add Cheerleader
              </button>
            </div>
            <div className="cheerleader-grid">
              {cheerleaders.map(cheerleader => (
                <CheerleaderCard
                  key={cheerleader.id}
                  cheerleader={cheerleader}
                  onMerit={() => handleAwardPoint(cheerleader, 'merit')}
                  onDemerit={() => handleAwardPoint(cheerleader, 'demerit')}
                  isCoach={true}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h2>🏆 Squad Leaderboard</h2>
            <div className="leaderboard">
              {sortedCheerleaders.map((cheerleader, index) => (
                <div key={cheerleader.id} className={`leaderboard-item rank-${index + 1}`}>
                  <span className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </span>
                  <span className="avatar">{cheerleader.avatar}</span>
                  <span className="name">{cheerleader.name}</span>
                  <span className={`points ${cheerleader.totalPoints >= 0 ? 'positive' : 'negative'}`}>
                    {cheerleader.totalPoints >= 0 ? '+' : ''}{cheerleader.totalPoints} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            <h2>📋 Recent Activity</h2>
            <RecentActivity history={pointHistory} cheerleaders={cheerleaders} limit={50} />
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            <AnnouncementSection isCoach={true} />
          </div>
        )}
      </main>

      {showAddModal && (
        <AddCheerleaderModal onClose={() => setShowAddModal(false)} />
      )}

      {selectedCheerleader && pointModalType && (
        <PointModal
          cheerleader={selectedCheerleader}
          type={pointModalType}
          onClose={closePointModal}
        />
      )}
    </div>
  );
};

export default CoachDashboard;
