import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import CheerleaderCard from '../components/CheerleaderCard';
import AddCheerleaderModal from '../components/AddCheerleaderModal';
import EditCheerleaderModal from '../components/EditCheerleaderModal';
import PointModal from '../components/PointModal';
import BulkAwardModal from '../components/BulkAwardModal';
import AnnouncementSection from '../components/AnnouncementSection';
import RecentActivity from '../components/RecentActivity';
import CoachStatHeader from '../components/CoachStatHeader';
import SquadToolbar from '../components/SquadToolbar';
import MessageInbox from '../components/MessageInbox';
import TierBadge from '../components/TierBadge';
import SettingsPanel from '../components/settings/SettingsPanel';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    cheerleaders,
    pointHistory,
    groups,
    currentSeason,
    getUnreadCount,
    getGroupMembers,
    resetToDemo,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCheerleader, setEditingCheerleader] = useState(null);
  const [selectedCheerleader, setSelectedCheerleader] = useState(null);
  const [pointModalType, setPointModalType] = useState(null); // 'merit' or 'demerit'
  const [bulkAward, setBulkAward] = useState(null); // { cheerleaders, type }
  const [activeTab, setActiveTab] = useState('squad');

  // Squad view controls
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('points-desc');
  const [groupFilter, setGroupFilter] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Activity view controls
  const [activityScope, setActivityScope] = useState('season'); // 'season' | 'all'
  const [activityGroup, setActivityGroup] = useState(null);

  const unreadCount = getUnreadCount('coach');

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

  // Most recent award per cheerleader, for the "Recent activity" sort.
  const lastActivityAt = useMemo(() => {
    const map = new Map();
    pointHistory.forEach(entry => {
      const existing = map.get(entry.cheerleaderId);
      if (!existing || new Date(entry.timestamp) > new Date(existing)) {
        map.set(entry.cheerleaderId, entry.timestamp);
      }
    });
    return map;
  }, [pointHistory]);

  const visibleCheerleaders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = cheerleaders.filter(c => {
      if (groupFilter && !(c.groupIds || []).includes(groupFilter)) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        (c.position || '').toLowerCase().includes(term)
      );
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'points-asc':
        sorted.sort((a, b) => (a.totalPoints || 0) - (b.totalPoints || 0));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          const aTime = lastActivityAt.get(a.id);
          const bTime = lastActivityAt.get(b.id);
          if (!aTime && !bTime) return a.name.localeCompare(b.name);
          if (!aTime) return 1;
          if (!bTime) return -1;
          return new Date(bTime) - new Date(aTime);
        });
        break;
      default:
        sorted.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    }
    return sorted;
  }, [cheerleaders, search, sortBy, groupFilter, lastActivityAt]);

  const leaderboardCheerleaders = useMemo(() => {
    const scoped = groupFilter
      ? cheerleaders.filter(c => (c.groupIds || []).includes(groupFilter))
      : cheerleaders;
    return [...scoped].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [cheerleaders, groupFilter]);

  const visibleActivity = useMemo(() => {
    let entries = pointHistory;
    if (activityScope === 'season') {
      entries = entries.filter(h => h.seasonId === currentSeason.id);
    }
    if (activityGroup) {
      const memberIds = getGroupMembers(activityGroup).map(c => c.id);
      entries = entries.filter(h => memberIds.includes(h.cheerleaderId));
    }
    return entries;
  }, [pointHistory, activityScope, activityGroup, currentSeason, getGroupMembers]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const openBulkAward = (type) => {
    const targets = cheerleaders.filter(c => selectedIds.includes(c.id));
    if (targets.length > 0) setBulkAward({ cheerleaders: targets, type });
  };

  const awardWholeGroup = (groupId, type) => {
    const members = getGroupMembers(groupId);
    if (members.length > 0) setBulkAward({ cheerleaders: members, type });
  };

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
        <button
          className={`nav-tab ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          ✉️ Inbox
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'squad' && (
          <div className="squad-section">
            <CoachStatHeader
              cheerleaders={cheerleaders}
              pointHistory={pointHistory}
              currentSeason={currentSeason}
            />

            <div className="section-header">
              <h2>
                My Squad ({visibleCheerleaders.length}
                {visibleCheerleaders.length !== cheerleaders.length && ` of ${cheerleaders.length}`}
                )
              </h2>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                + Add Cheerleader
              </button>
            </div>

            <SquadToolbar
              search={search}
              onSearch={setSearch}
              sortBy={sortBy}
              onSort={setSortBy}
              groupFilter={groupFilter}
              onGroupFilter={setGroupFilter}
              groups={groups}
              selectMode={selectMode}
              onToggleSelectMode={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              selectedIds={selectedIds}
              onSelectAll={() => setSelectedIds(visibleCheerleaders.map(c => c.id))}
              onClearSelection={() => setSelectedIds([])}
              onBulkMerit={() => openBulkAward('merit')}
              onBulkDemerit={() => openBulkAward('demerit')}
              visibleCount={visibleCheerleaders.length}
            />

            {groupFilter && !selectMode && (
              <div className="group-award-bar">
                <span>
                  Award this whole group at once:
                </span>
                <button className="merit-btn wide" onClick={() => awardWholeGroup(groupFilter, 'merit')}>
                  + Merit to group
                </button>
                <button
                  className="demerit-btn wide"
                  onClick={() => awardWholeGroup(groupFilter, 'demerit')}
                >
                  − Demerit to group
                </button>
              </div>
            )}

            {visibleCheerleaders.length === 0 ? (
              <p className="empty-hint">
                {cheerleaders.length === 0
                  ? 'No cheerleaders yet — add your first one to get started.'
                  : 'Nobody matches that search or group.'}
              </p>
            ) : (
              <div className="cheerleader-grid">
                {visibleCheerleaders.map(cheerleader => (
                  <CheerleaderCard
                    key={cheerleader.id}
                    cheerleader={cheerleader}
                    onMerit={() => handleAwardPoint(cheerleader, 'merit')}
                    onDemerit={() => handleAwardPoint(cheerleader, 'demerit')}
                    onEdit={() => setEditingCheerleader(cheerleader)}
                    isCoach={true}
                    selectable={selectMode}
                    selected={selectedIds.includes(cheerleader.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h2>🏆 Squad Leaderboard</h2>
            {groups.length > 0 && (
              <div className="group-filter-chips">
                <button
                  className={`group-chip ${!groupFilter ? 'active' : ''}`}
                  onClick={() => setGroupFilter(null)}
                >
                  Everyone
                </button>
                {groups.map(group => (
                  <button
                    key={group.id}
                    className={`group-chip ${groupFilter === group.id ? 'active' : ''}`}
                    style={
                      groupFilter === group.id
                        ? { background: group.color, borderColor: group.color, color: '#fff' }
                        : { borderColor: group.color, color: group.color }
                    }
                    onClick={() => setGroupFilter(groupFilter === group.id ? null : group.id)}
                  >
                    {group.icon} {group.name}
                  </button>
                ))}
              </div>
            )}
            <div className="leaderboard">
              {leaderboardCheerleaders.length === 0 ? (
                <p className="empty-hint">Nobody in this group yet.</p>
              ) : (
                leaderboardCheerleaders.map((cheerleader, index) => (
                  <div key={cheerleader.id} className={`leaderboard-item rank-${index + 1}`}>
                    <span className="rank">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </span>
                    <span className="avatar">{cheerleader.avatar}</span>
                    <span className="name">
                      {cheerleader.name}
                      <TierBadge points={cheerleader.totalPoints ?? 0} size="sm" />
                    </span>
                    <span
                      className={`points ${(cheerleader.totalPoints ?? 0) >= 0 ? 'positive' : 'negative'}`}
                    >
                      {(cheerleader.totalPoints ?? 0) >= 0 ? '+' : ''}
                      {cheerleader.totalPoints ?? 0} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            <div className="section-header">
              <h2>📋 Recent Activity</h2>
              <div className="activity-filters">
                <select
                  className="toolbar-select"
                  value={activityScope}
                  onChange={(e) => setActivityScope(e.target.value)}
                >
                  <option value="season">{currentSeason.name}</option>
                  <option value="all">All time</option>
                </select>
                {groups.length > 0 && (
                  <select
                    className="toolbar-select"
                    value={activityGroup || ''}
                    onChange={(e) => setActivityGroup(e.target.value || null)}
                  >
                    <option value="">Everyone</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.icon} {group.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <RecentActivity
              history={visibleActivity}
              cheerleaders={cheerleaders}
              limit={50}
              emptyMessage={
                activityScope === 'season'
                  ? `Nothing recorded in ${currentSeason.name} yet.`
                  : 'No activity yet. Start awarding merits and demerits!'
              }
            />
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            <AnnouncementSection isCoach={true} />
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="inbox-section">
            <h2>✉️ Parent Messages</h2>
            <MessageInbox />
          </div>
        )}

        {activeTab === 'settings' && <SettingsPanel />}
      </main>

      {showAddModal && (
        <AddCheerleaderModal onClose={() => setShowAddModal(false)} />
      )}

      {editingCheerleader && (
        <EditCheerleaderModal
          cheerleader={editingCheerleader}
          onClose={() => setEditingCheerleader(null)}
        />
      )}

      {selectedCheerleader && pointModalType && (
        <PointModal
          cheerleader={selectedCheerleader}
          type={pointModalType}
          onClose={closePointModal}
        />
      )}

      {bulkAward && (
        <BulkAwardModal
          cheerleaders={bulkAward.cheerleaders}
          type={bulkAward.type}
          onClose={() => {
            setBulkAward(null);
            exitSelectMode();
          }}
        />
      )}
    </div>
  );
};

export default CoachDashboard;
