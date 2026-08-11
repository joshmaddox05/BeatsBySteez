import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import EmojiPicker from '../EmojiPicker';
import { groupEmojis, groupColors } from '../../data/emojiOptions';

const blankDraft = { name: '', icon: '🏆', color: groupColors[0].value };

const GroupSettings = () => {
  const {
    groups,
    cheerleaders,
    addGroup,
    updateGroup,
    deleteGroup,
    setGroupMembers,
    getGroupMembers,
  } = useApp();

  const [draft, setDraft] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingMembersFor, setEditingMembersFor] = useState(null);

  const handleSave = () => {
    const payload = { name: draft.name.trim(), icon: draft.icon, color: draft.color };
    if (!payload.name) return;
    if (draft.id) {
      updateGroup(draft.id, payload);
    } else {
      addGroup(payload);
    }
    setDraft(null);
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteGroup(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(current => (current === id ? null : current)), 3000);
    }
  };

  const toggleMember = (group, cheerleaderId) => {
    const current = getGroupMembers(group.id).map(c => c.id);
    const next = current.includes(cheerleaderId)
      ? current.filter(id => id !== cheerleaderId)
      : [...current, cheerleaderId];
    setGroupMembers(group.id, next);
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h3>Squad Groups</h3>
        <button className="add-btn" onClick={() => setDraft({ ...blankDraft })}>
          + New Group
        </button>
      </div>
      <p className="settings-hint">
        Split the squad however you run practice — Varsity and JV, stunt groups, tumbling levels. A
        cheerleader can be in as many groups as you like. Groups let you filter the squad and award
        a whole group at once.
      </p>

      {draft && (
        <div className="group-draft">
          <div className="form-group">
            <label>Group name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Varsity"
              autoFocus
              maxLength={30}
            />
          </div>
          <EmojiPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
            options={groupEmojis}
            label="Icon"
          />
          <div className="form-group">
            <label>Color</label>
            <div className="group-color-picker">
              {groupColors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-swatch ${draft.color === color.value ? 'selected' : ''}`}
                  style={{ background: color.value }}
                  onClick={() => setDraft({ ...draft, color: color.value })}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setDraft(null)}>Cancel</button>
            <button className="submit-btn" onClick={handleSave} disabled={!draft.name.trim()}>
              {draft.id ? 'Save Group' : 'Add Group'}
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="empty-hint">No groups yet. The squad shows as one list until you add one.</p>
      ) : (
        <div className="group-admin-list">
          {groups.map(group => {
            const members = getGroupMembers(group.id);
            const memberIds = members.map(c => c.id);
            const open = editingMembersFor === group.id;
            return (
              <div key={group.id} className="group-card" style={{ borderLeftColor: group.color }}>
                <div className="group-card-header">
                  <span className="group-card-icon">{group.icon}</span>
                  <div className="group-card-info">
                    <strong style={{ color: group.color }}>{group.name}</strong>
                    <small>
                      {members.length} {members.length === 1 ? 'cheerleader' : 'cheerleaders'}
                    </small>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      onClick={() => setEditingMembersFor(open ? null : group.id)}
                      title="Edit members"
                    >
                      {open ? '▲' : '👥'}
                    </button>
                    <button className="icon-btn" onClick={() => setDraft({ ...group })} title="Edit">
                      ✎
                    </button>
                    <button
                      className={`delete-btn ${confirmDeleteId === group.id ? 'confirm' : ''}`}
                      onClick={() => handleDelete(group.id)}
                    >
                      {confirmDeleteId === group.id ? 'Confirm' : 'Delete'}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="member-picker">
                    {cheerleaders.length === 0 ? (
                      <p className="empty-hint">No cheerleaders on the squad yet.</p>
                    ) : (
                      cheerleaders.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className={`member-option ${memberIds.includes(c.id) ? 'selected' : ''}`}
                          onClick={() => toggleMember(group, c.id)}
                        >
                          <span className="member-avatar">{c.avatar}</span>
                          <span className="member-name">{c.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupSettings;
