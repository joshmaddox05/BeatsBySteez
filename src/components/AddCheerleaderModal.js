import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { avatarOptions } from '../data/defaultCategories';

const AddCheerleaderModal = ({ onClose }) => {
  const { addCheerleader } = useApp();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [newCheerleader, setNewCheerleader] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const cheerleader = addCheerleader(name.trim(), selectedAvatar);
      setNewCheerleader(cheerleader);
    }
  };

  if (newCheerleader) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal add-cheerleader-modal success" onClick={(e) => e.stopPropagation()}>
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>Cheerleader Added!</h2>
            <div className="new-cheerleader-info">
              <span className="avatar">{newCheerleader.avatar}</span>
              <span className="name">{newCheerleader.name}</span>
            </div>
            <div className="parent-code-display">
              <p>Share this code with the parent:</p>
              <div className="code">{newCheerleader.parentCode}</div>
              <small>Parents use this code to view their child's progress</small>
            </div>
            <button className="close-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-cheerleader-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Add New Cheerleader</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter cheerleader's name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Choose Avatar</label>
            <div className="avatar-picker">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="preview">
            <span className="avatar-preview">{selectedAvatar}</span>
            <span className="name-preview">{name || 'Name'}</span>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={!name.trim()}>
              Add Cheerleader
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCheerleaderModal;
