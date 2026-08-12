import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import TierBadge from './TierBadge';

const CheerleaderCard = ({
  cheerleader,
  onMerit,
  onDemerit,
  onEdit,
  isCoach,
  selectable = false,
  selected = false,
  onToggleSelect,
}) => {
  const { getCheerleaderHistory, removeCheerleader, getGroupsFor } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const history = getCheerleaderHistory(cheerleader.id).slice(0, 5);
  const groups = getGroupsFor(cheerleader.id);
  const totalPoints = cheerleader.totalPoints ?? 0;

  const handleDelete = () => {
    if (confirmDelete) {
      removeCheerleader(cheerleader.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  // In select mode the whole card toggles selection instead of expanding —
  // tapping a dozen small checkboxes in a row is miserable on a phone.
  const handleCardClick = () => {
    if (selectable) {
      onToggleSelect?.(cheerleader.id);
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div
      className={`cheerleader-card ${showDetails ? 'expanded' : ''} ${selected ? 'selected' : ''}`}
    >
      <div className="card-main" onClick={handleCardClick}>
        {selectable && (
          <span className={`card-select ${selected ? 'checked' : ''}`} aria-hidden="true">
            {selected ? '✓' : ''}
          </span>
        )}
        <div className="avatar-container">
          <span className="avatar">{cheerleader.avatar}</span>
        </div>
        <div className="info">
          <h3>{cheerleader.name}</h3>
          <div className={`points-display ${totalPoints >= 0 ? 'positive' : 'negative'}`}>
            {totalPoints >= 0 ? '+' : ''}{totalPoints} points
          </div>
          <TierBadge points={totalPoints} size="sm" />
          {cheerleader.position && (
            <div className="card-meta-row">
              <span className="card-position">{cheerleader.position}</span>
            </div>
          )}
          {groups.length > 0 && (
            <div className="card-group-chips">
              {groups.map(group => (
                <span
                  key={group.id}
                  className="group-chip mini"
                  style={{ borderColor: group.color, color: group.color }}
                >
                  {group.icon} {group.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {isCoach && !selectable && (
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

      {/* Corner-pinned so the awarding buttons keep the room they need. */}
      {isCoach && !selectable && onEdit && (
        <button className="card-edit-btn" onClick={onEdit} title="Edit profile">
          ✎
        </button>
      )}

      {showDetails && !selectable && (
        <div className="card-details">
          {cheerleader.notes && isCoach && (
            <div className="card-notes">
              <h4>Coach Notes</h4>
              <p>{cheerleader.notes}</p>
            </div>
          )}

          <div className="recent-history">
            <h4>Recent Activity</h4>
            {history.length > 0 ? (
              <ul>
                {history.map(entry => {
                  const category = entry.category || {};
                  const points = entry.points ?? 0;
                  return (
                    <li key={entry.id} className={entry.isMerit ? 'merit' : 'demerit'}>
                      <span className="icon">{category.icon || (entry.isMerit ? '⭐' : '⚠️')}</span>
                      <span className="category">{category.name || 'Point Adjustment'}</span>
                      <span className="points">
                        {points > 0 ? '+' : ''}{points}
                      </span>
                    </li>
                  );
                })}
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
