import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import EmojiPicker from './EmojiPicker';
import { meritEmojis, demeritEmojis } from '../data/emojiOptions';

// Create or edit one point category. The coach enters a plain magnitude and
// picks merit or demerit; the sign is applied for her.
const CategoryEditorModal = ({ category, defaultType = 'merit', onClose }) => {
  const { addCategory, updateCategory } = useApp();
  const editing = Boolean(category);

  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState(category?.type || defaultType);
  const [points, setPoints] = useState(Math.abs(category?.points ?? 5));
  const [icon, setIcon] = useState(category?.icon || (defaultType === 'merit' ? '⭐' : '⚠️'));

  const magnitude = Math.min(50, Math.max(1, Number(points) || 0));
  const signedPoints = type === 'demerit' ? -magnitude : magnitude;
  const canSave = name.trim().length > 0 && magnitude >= 1;

  const handleTypeChange = (nextType) => {
    setType(nextType);
    // Swap a still-default icon so a flipped category doesn't keep a star on a
    // demerit, but never clobber a deliberate pick.
    if (icon === '⭐' && nextType === 'demerit') setIcon('⚠️');
    if (icon === '⚠️' && nextType === 'merit') setIcon('⭐');
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload = { name: name.trim(), icon, points: magnitude, type };
    if (editing) {
      updateCategory(category.id, payload);
    } else {
      addCategory(payload);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal category-editor-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>{editing ? 'Edit Category' : 'New Category'}</h2>

        <div className="form-group">
          <label>Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={type === 'merit' ? 'active merit' : ''}
              onClick={() => handleTypeChange('merit')}
            >
              👍 Merit
            </button>
            <button
              type="button"
              className={type === 'demerit' ? 'active demerit' : ''}
              onClick={() => handleTypeChange('demerit')}
            >
              👎 Demerit
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'merit' ? 'e.g. Nailed Routine' : 'e.g. Late to Practice'}
            autoFocus
            maxLength={40}
          />
        </div>

        <div className="form-group">
          <label>Points (1–50)</label>
          <input
            type="number"
            min={1}
            max={50}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
          <small className="settings-hint">
            Saved as {signedPoints > 0 ? '+' : ''}{signedPoints} — {type === 'merit' ? 'added to' : 'taken off'} her total.
          </small>
        </div>

        <EmojiPicker
          value={icon}
          onChange={setIcon}
          options={type === 'merit' ? meritEmojis : demeritEmojis}
          label="Icon"
        />

        <div className="form-group">
          <label>Preview</label>
          <div className="category-grid preview-grid">
            <button type="button" className="category-btn selected" disabled>
              <span className="cat-icon">{icon}</span>
              <span className="cat-name">{name.trim() || 'Category name'}</span>
              <span className={`cat-points ${signedPoints > 0 ? 'positive' : 'negative'}`}>
                {signedPoints > 0 ? '+' : ''}{signedPoints}
              </span>
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="submit-btn" onClick={handleSave} disabled={!canSave}>
            {editing ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditorModal;
