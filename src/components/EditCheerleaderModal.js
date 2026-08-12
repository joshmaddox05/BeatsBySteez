import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import EmojiPicker from './EmojiPicker';
import CheerleaderFields from './CheerleaderFields';
import { avatarOptions } from '../data/defaultCategories';

const EditCheerleaderModal = ({ cheerleader, onClose }) => {
  const { updateCheerleader, regenerateParentCode, setCheerleaderGroups } = useApp();

  const [name, setName] = useState(cheerleader.name);
  const [avatar, setAvatar] = useState(cheerleader.avatar);
  const [position, setPosition] = useState(cheerleader.position || '');
  const [notes, setNotes] = useState(cheerleader.notes || '');
  const [groupIds, setGroupIds] = useState(cheerleader.groupIds || []);
  const [parentCode, setParentCode] = useState(cheerleader.parentCode);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const toggleGroup = (id) => {
    setGroupIds(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]));
  };

  const handleRegenerate = () => {
    if (confirmRegen) {
      setParentCode(regenerateParentCode(cheerleader.id));
      setConfirmRegen(false);
    } else {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 3000);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateCheerleader(cheerleader.id, {
      name: name.trim(),
      avatar,
      position,
      notes: notes.trim(),
    });
    setCheerleaderGroups(cheerleader.id, groupIds);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-cheerleader-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Edit {cheerleader.name.split(' ')[0]}</h2>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={40}
          />
        </div>

        <EmojiPicker value={avatar} onChange={setAvatar} options={avatarOptions} label="Avatar" />

        <CheerleaderFields
          position={position}
          onPosition={setPosition}
          notes={notes}
          onNotes={setNotes}
          groupIds={groupIds}
          onToggleGroup={toggleGroup}
        />

        <div className="form-group">
          <label>Parent code</label>
          <div className="parent-code-row">
            <code className="code">{parentCode}</code>
            <button
              type="button"
              className={`delete-btn ${confirmRegen ? 'confirm' : ''}`}
              onClick={handleRegenerate}
            >
              {confirmRegen ? 'Confirm — old code stops working' : 'Regenerate'}
            </button>
          </div>
          <small className="settings-hint">
            Regenerating takes effect immediately. Whoever has the old code will not be able to log
            in with it.
          </small>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCheerleaderModal;
