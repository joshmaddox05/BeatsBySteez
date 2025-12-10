import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const PointModal = ({ cheerleader, type, onClose }) => {
  const { meritCategories, demeritCategories, awardPoints } = useApp();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [awarded, setAwarded] = useState(false);

  const categories = type === 'merit' ? meritCategories : demeritCategories;
  const isMerit = type === 'merit';

  const handleAward = () => {
    if (selectedCategory) {
      awardPoints(cheerleader.id, selectedCategory, isMerit, note);
      setAwarded(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  if (awarded) {
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
              <span className={isMerit ? 'positive' : 'negative'}>
                {selectedCategory.points > 0 ? '+' : ''}{selectedCategory.points} points
              </span>
            </p>
            <p className="category-name">{selectedCategory.icon} {selectedCategory.name}</p>
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

        <div className="category-grid">
          {categories.map((category) => (
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

        <div className="form-group">
          <label>Add a note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any additional details..."
            rows={2}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`submit-btn ${type}`}
            onClick={handleAward}
            disabled={!selectedCategory}
          >
            {isMerit ? 'Award Merit' : 'Give Demerit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointModal;
