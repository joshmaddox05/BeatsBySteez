import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import EmojiPicker from '../EmojiPicker';
import { tierEmojis } from '../../data/emojiOptions';

const blankDraft = { name: '', icon: '🌟', threshold: 25 };

const TierSettings = () => {
  const {
    rewardTiers,
    cheerleaders,
    addRewardTier,
    updateRewardTier,
    deleteRewardTier,
  } = useApp();

  const [draft, setDraft] = useState(null); // null | { id?, name, icon, threshold }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const sorted = [...rewardTiers].sort((a, b) => a.threshold - b.threshold);

  // Who currently sits in each tier — the band from this threshold up to the
  // next one. Makes it obvious when a threshold is set somewhere nobody reaches.
  const membersInTier = (index) => {
    const floor = sorted[index].threshold;
    const ceiling = sorted[index + 1]?.threshold ?? Infinity;
    return cheerleaders.filter(c => {
      const total = c.totalPoints ?? 0;
      return total >= floor && total < ceiling;
    });
  };

  const handleSave = () => {
    const payload = {
      name: draft.name.trim(),
      icon: draft.icon,
      threshold: Math.max(0, Number(draft.threshold) || 0),
    };
    if (!payload.name) return;
    if (draft.id) {
      updateRewardTier(draft.id, payload);
    } else {
      addRewardTier(payload);
    }
    setDraft(null);
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteRewardTier(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(current => (current === id ? null : current)), 3000);
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h3>Reward Tiers</h3>
        <button className="add-btn" onClick={() => setDraft({ ...blankDraft })}>
          + New Tier
        </button>
      </div>
      <p className="settings-hint">
        Name the levels your squad works toward. A cheerleader shows the highest level she has
        reached, on her card and in her own and her parent's view. Delete them all to turn the
        feature off.
      </p>

      {draft && (
        <div className="tier-draft">
          <div className="form-group">
            <label>Level name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Spirit Star"
              autoFocus
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label>Points needed</label>
            <input
              type="number"
              min={0}
              value={draft.threshold}
              onChange={(e) => setDraft({ ...draft, threshold: e.target.value })}
            />
          </div>
          <EmojiPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
            options={tierEmojis}
            label="Badge"
          />
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setDraft(null)}>Cancel</button>
            <button className="submit-btn" onClick={handleSave} disabled={!draft.name.trim()}>
              {draft.id ? 'Save Level' : 'Add Level'}
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="empty-hint">
          No reward levels. Cheerleaders just see their point total — add a level to give them
          something to aim at.
        </p>
      ) : (
        <div className="tier-admin-list">
          {sorted.map((tier, index) => {
            const members = membersInTier(index);
            return (
              <div key={tier.id} className="tier-admin-row">
                <span className="tier-row-icon">{tier.icon}</span>
                <div className="tier-row-info">
                  <strong>{tier.name}</strong>
                  <span className="tier-threshold">{tier.threshold}+ points</span>
                  <span className="tier-row-members">
                    {members.length === 0
                      ? 'Nobody here yet'
                      : members.map(m => `${m.avatar} ${m.name.split(' ')[0]}`).join(', ')}
                  </span>
                </div>
                <div className="row-actions">
                  <button
                    className="icon-btn"
                    onClick={() => setDraft({ ...tier })}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className={`delete-btn ${confirmDeleteId === tier.id ? 'confirm' : ''}`}
                    onClick={() => handleDelete(tier.id)}
                  >
                    {confirmDeleteId === tier.id ? 'Confirm' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TierSettings;
