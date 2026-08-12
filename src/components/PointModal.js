import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const PointModal = ({ cheerleader, type, onClose }) => {
  const { meritCategories, demeritCategories, awardPoints, squadRules, getTodayPointTotal } = useApp();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const categories = type === 'merit' ? meritCategories : demeritCategories;
  const isMerit = type === 'merit';

  const noteMissing = squadRules.requireNoteOnDemerits && !isMerit && !note.trim();
  const usedToday = getTodayPointTotal(cheerleader.id);
  const capRemaining = squadRules.dailyPointCap > 0 ? squadRules.dailyPointCap - usedToday : null;

  const handleAward = () => {
    if (!selectedCategory) return;
    const outcome = awardPoints(cheerleader.id, selectedCategory, isMerit, note);
    if (!outcome.ok) {
      setError(outcome.message);
      return;
    }
    setError(null);
    setResult(outcome);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  if (result) {
    // Squad rules can shrink an award, so report what actually landed rather
    // than what the category is nominally worth.
    const applied = result.applied;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className={`modal point-modal ${type} awarded`} onClick={(e) => e.stopPropagation()}>
          <div className="awarded-content">
            <div className="awarded-icon">
              {isMerit ? '🌟' : '📝'}
            </div>
            <h2>{isMerit ? 'Merit Awarded!' : 'Demerit Recorded'}</h2>
            <p>
              <strong>{cheerleader.name}</strong> received{' '}
              <span className={applied > 0 ? 'positive' : 'negative'}>
                {applied > 0 ? '+' : ''}{applied} points
              </span>
            </p>
            <p className="category-name">{selectedCategory.icon} {selectedCategory.name}</p>
            {result.capped && (
              <p className="awarded-note">
                Reduced from {result.nominal > 0 ? '+' : ''}{result.nominal} — today's{' '}
                {squadRules.dailyPointCap}-point limit.
              </p>
            )}
            {result.clamped && (
              <p className="awarded-note">
                Reduced from {result.nominal} — totals can't go below zero.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal point-modal ${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <span className="cheerleader-avatar">{cheerleader.avatar}</span>
          <div>
            <h2>{isMerit ? 'Award Merit' : 'Give Demerit'}</h2>
            <p>{cheerleader.name}</p>
          </div>
        </div>

        {capRemaining !== null && (
          <p className="settings-hint cap-hint">
            {capRemaining > 0
              ? `${capRemaining} of ${squadRules.dailyPointCap} points left for today.`
              : `Daily limit of ${squadRules.dailyPointCap} points already reached today.`}
          </p>
        )}

        {error && <div className="error-msg">{error}</div>}

        {categories.length === 0 ? (
          <p className="empty-hint">
            No {isMerit ? 'merit' : 'demerit'} categories yet. Add some in Settings → Categories.
          </p>
        ) : (
          <div className="category-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(category);
                  setError(null);
                }}
              >
                <span className="cat-icon">{category.icon}</span>
                <span className="cat-name">{category.name}</span>
                <span className={`cat-points ${category.points > 0 ? 'positive' : 'negative'}`}>
                  {category.points > 0 ? '+' : ''}{category.points}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="form-group">
          <label>
            {squadRules.requireNoteOnDemerits && !isMerit ? 'Add a note (required)' : 'Add a note (optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any additional details..."
            rows={2}
          />
          {noteMissing && <small className="settings-hint">A note is required for demerits.</small>}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`submit-btn ${type}`}
            onClick={handleAward}
            disabled={!selectedCategory || noteMissing}
          >
            {isMerit ? 'Award Merit' : 'Give Demerit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointModal;
