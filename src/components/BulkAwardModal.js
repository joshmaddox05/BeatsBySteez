import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

// Award one category to several cheerleaders. The squad rules are applied per
// cheerleader, so this can legitimately succeed for some and not others — hence
// the results screen rather than a single "done" message.
const BulkAwardModal = ({ cheerleaders, type, onClose }) => {
  const { meritCategories, demeritCategories, bulkAwardPoints, squadRules } = useApp();

  const [targets, setTargets] = useState(cheerleaders);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState(null);

  const categories = type === 'merit' ? meritCategories : demeritCategories;
  const isMerit = type === 'merit';
  const noteMissing = squadRules.requireNoteOnDemerits && !isMerit && !note.trim();

  const removeTarget = (id) => setTargets(prev => prev.filter(c => c.id !== id));

  const handleAward = () => {
    if (!selectedCategory || targets.length === 0) return;
    setOutcome(bulkAwardPoints(targets.map(c => c.id), selectedCategory, isMerit, note));
  };

  if (outcome) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className={`modal bulk-award-modal ${type}`} onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <h2>
            {outcome.failCount === 0
              ? isMerit ? 'Merits Awarded!' : 'Demerits Recorded'
              : 'Partly Done'}
          </h2>
          <p className="category-name">{selectedCategory.icon} {selectedCategory.name}</p>
          <p className="settings-hint">
            {outcome.successCount} of {outcome.successCount + outcome.failCount} went through.
          </p>

          <div className="bulk-results-list">
            {outcome.results.map(result => (
              <div
                key={result.cheerleaderId}
                className={`bulk-result ${result.ok ? 'ok' : 'fail'}`}
              >
                <span className="bulk-result-name">{result.name}</span>
                {result.ok ? (
                  <span className={`bulk-result-detail ${result.applied > 0 ? 'positive' : 'negative'}`}>
                    {result.applied > 0 ? '+' : ''}{result.applied}
                    {(result.capped || result.clamped) && ' (reduced)'}
                  </span>
                ) : (
                  <span className="bulk-result-detail">{result.message}</span>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="submit-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal bulk-award-modal ${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <span className="cheerleader-avatar">{isMerit ? '🌟' : '📝'}</span>
          <div>
            <h2>{isMerit ? 'Award Merit' : 'Give Demerit'}</h2>
            <p>{targets.length} {targets.length === 1 ? 'cheerleader' : 'cheerleaders'}</p>
          </div>
        </div>

        <div className="form-group">
          <label>Who's getting this</label>
          <div className="bulk-target-chips">
            {targets.map(c => (
              <span key={c.id} className="bulk-target-chip">
                {c.avatar} {c.name}
                <button
                  type="button"
                  className="remove"
                  onClick={() => removeTarget(c.id)}
                  title={`Remove ${c.name}`}
                >
                  ×
                </button>
              </span>
            ))}
            {targets.length === 0 && (
              <small className="settings-hint">Nobody left — close and pick again.</small>
            )}
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="empty-hint">
            No {isMerit ? 'merit' : 'demerit'} categories yet. Add some in Settings → Categories.
          </p>
        ) : (
          <div className="category-grid">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(category)}
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
            {squadRules.requireNoteOnDemerits && !isMerit
              ? 'Add a note (required)'
              : 'Add a note (optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="The same note is saved for everyone selected..."
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
            disabled={!selectedCategory || targets.length === 0 || noteMissing}
          >
            {isMerit ? 'Award to' : 'Give to'} {targets.length}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAwardModal;
