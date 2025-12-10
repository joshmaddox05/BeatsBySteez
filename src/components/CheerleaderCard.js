import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const CheerleaderCard = ({ cheerleader, onMerit, onDemerit, isCoach, showHistory = false }) => {
  const { getCheerleaderHistory, removeCheerleader } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const history = getCheerleaderHistory(cheerleader.id).slice(0, 5);

  const handleDelete = () => {
    if (confirmDelete) {
      removeCheerleader(cheerleader.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className={`cheerleader-card ${showDetails ? 'expanded' : ''}`}>
      <div className="card-main" onClick={() => setShowDetails(!showDetails)}>
        <div className="avatar-container">
          <span className="avatar">{cheerleader.avatar}</span>
        </div>
        <div className="info">
          <h3>{cheerleader.name}</h3>
          <div className={`points-display ${cheerleader.totalPoints >= 0 ? 'positive' : 'negative'}`}>
            {cheerleader.totalPoints >= 0 ? '+' : ''}{cheerleader.totalPoints} points
          </div>
        </div>
        {isCoach && (
          <div className="quick-actions" onClick={(e) => e.stopPropagation()}>
            <button className="merit-btn" onClick={onMerit} title="Award Merit">
              +
            </button>
            <button className="demerit-btn" onClick={onDemerit} title="Give Demerit">
              −
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="card-details">
          <div className="recent-history">
            <h4>Recent Activity</h4>
            {history.length > 0 ? (
              <ul>
                {history.map(entry => (
                  <li key={entry.id} className={entry.isMerit ? 'merit' : 'demerit'}>
                    <span className="icon">{entry.category.icon}</span>
                    <span className="category">{entry.category.name}</span>
                    <span className="points">
                      {entry.points > 0 ? '+' : ''}{entry.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-history">No activity yet</p>
            )}
          </div>

          {isCoach && (
            <div className="card-footer">
              <div className="parent-code">
                <small>Parent Code: <strong>{cheerleader.parentCode}</strong></small>
              </div>
              <button
                className={`delete-btn ${confirmDelete ? 'confirm' : ''}`}
                onClick={handleDelete}
              >
                {confirmDelete ? 'Click to Confirm' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheerleaderCard;
