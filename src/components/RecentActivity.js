import React from 'react';
import { useApp } from '../contexts/AppContext';

const RecentActivity = ({ history, cheerleaders, limit = 20 }) => {
  const { removePointEntry, userRole } = useApp();

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCheerleaderName = (id) => {
    const cheerleader = cheerleaders.find(c => c.id === id);
    return cheerleader ? { name: cheerleader.name, avatar: cheerleader.avatar } : { name: 'Unknown', avatar: '❓' };
  };

  const displayHistory = history.slice(0, limit);

  if (displayHistory.length === 0) {
    return (
      <div className="recent-activity empty">
        <p>No activity yet. Start awarding merits and demerits!</p>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <ul className="activity-list">
        {displayHistory.map((entry) => {
          const cheerleader = getCheerleaderName(entry.cheerleaderId);
          return (
            <li key={entry.id} className={`activity-item ${entry.isMerit ? 'merit' : 'demerit'}`}>
              <div className="activity-avatar">{cheerleader.avatar}</div>
              <div className="activity-details">
                <div className="activity-main">
                  <strong>{cheerleader.name}</strong>
                  <span className="activity-action">
                    {entry.isMerit ? 'earned' : 'received'}
                  </span>
                  <span className="activity-category">
                    {entry.category.icon} {entry.category.name}
                  </span>
                </div>
                {entry.note && <p className="activity-note">"{entry.note}"</p>}
                <div className="activity-meta">
                  <span className="activity-time">{formatDate(entry.timestamp)}</span>
                  <span className="activity-by">by {entry.awardedBy}</span>
                </div>
              </div>
              <div className="activity-points">
                <span className={entry.points > 0 ? 'positive' : 'negative'}>
                  {entry.points > 0 ? '+' : ''}{entry.points}
                </span>
              </div>
              {userRole === 'coach' && (
                <button
                  className="undo-btn"
                  onClick={() => removePointEntry(entry.id)}
                  title="Undo this action"
                >
                  ↩
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentActivity;
