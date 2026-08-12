import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const formatDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SeasonSettings = () => {
  const {
    currentSeason,
    seasons,
    cheerleaders,
    getSeasonEntries,
    startNewSeason,
    deleteArchivedSeason,
  } = useApp();

  const [newName, setNewName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [flash, setFlash] = useState(null);

  const currentEntries = getSeasonEntries(currentSeason.id);

  const handleStart = () => {
    const { archived, current } = startNewSeason(newName);
    setNewName('');
    setConfirming(false);
    setFlash(`${archived.name} archived. ${current.name} has started with everyone at 0.`);
    setTimeout(() => setFlash(null), 5000);
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteArchivedSeason(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(current => (current === id ? null : current)), 3000);
    }
  };

  return (
    <div className="settings-section">
      <h3>Season</h3>
      <p className="settings-hint">
        Starting a new season files the current standings away and puts everyone back at 0, so a
        fresh competition season or semester starts even. Nothing is deleted — every award stays in
        the activity feed under the season it happened in.
      </p>

      {flash && <div className="success-message">{flash}</div>}

      <div className="season-current-card">
        <div className="season-current-info">
          <span className="season-chip">Current</span>
          <strong>{currentSeason.name}</strong>
          <small>
            Started {formatDate(currentSeason.startedAt)} · {currentEntries.length}{' '}
            {currentEntries.length === 1 ? 'award' : 'awards'} · {cheerleaders.length}{' '}
            {cheerleaders.length === 1 ? 'cheerleader' : 'cheerleaders'}
          </small>
        </div>
      </div>

      <div className="danger-zone">
        <h4>Start a New Season</h4>
        {!confirming ? (
          <>
            <div className="form-group">
              <label>New season name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`e.g. Fall ${new Date().getFullYear()}`}
                maxLength={40}
              />
            </div>
            <button className="delete-btn" onClick={() => setConfirming(true)}>
              Start New Season
            </button>
          </>
        ) : (
          <div className="confirm-banner">
            <p>
              <strong>Reset every cheerleader to 0 points?</strong> {currentSeason.name} will be
              archived with the current standings, and{' '}
              <strong>{newName.trim() || `Season ${seasons.length + 2}`}</strong> will begin. All{' '}
              {currentEntries.length} past awards are kept and stay visible under Activity → All
              time.
            </p>
            <div className="confirm-banner-actions">
              <button className="cancel-btn" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button className="delete-btn confirm" onClick={handleStart}>
                Yes, Start New Season
              </button>
            </div>
          </div>
        )}
      </div>

      <h4>Past Seasons</h4>
      {seasons.length === 0 ? (
        <p className="empty-hint">No past seasons yet.</p>
      ) : (
        <div className="season-archive-list">
          {seasons.map(season => (
            <div key={season.id} className="season-archive-item">
              <div className="season-archive-header">
                <button
                  className="season-archive-toggle"
                  onClick={() => setExpanded(expanded === season.id ? null : season.id)}
                >
                  <strong>{season.name}</strong>
                  <small>
                    {formatDate(season.startedAt)} – {formatDate(season.endedAt)} ·{' '}
                    {season.entryCount} {season.entryCount === 1 ? 'award' : 'awards'}
                  </small>
                  <span className="season-archive-caret">{expanded === season.id ? '▲' : '▼'}</span>
                </button>
                <button
                  className={`delete-btn ${confirmDeleteId === season.id ? 'confirm' : ''}`}
                  onClick={() => handleDelete(season.id)}
                  title="Remove this archived record"
                >
                  {confirmDeleteId === season.id ? 'Confirm' : 'Remove'}
                </button>
              </div>

              {expanded === season.id && (
                <div className="season-standings">
                  {(season.standings || []).length === 0 ? (
                    <p className="empty-hint">No standings were recorded.</p>
                  ) : (
                    (season.standings || []).map((row, index) => (
                      <div key={row.cheerleaderId} className="season-standing-row">
                        <span className="rank">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `#${index + 1}`}
                        </span>
                        <span className="avatar">{row.avatar}</span>
                        <span className="name">{row.name}</span>
                        {row.tierName && <span className="tier-threshold">{row.tierName}</span>}
                        <span className={`points ${row.totalPoints >= 0 ? 'positive' : 'negative'}`}>
                          {row.totalPoints >= 0 ? '+' : ''}{row.totalPoints} pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeasonSettings;
