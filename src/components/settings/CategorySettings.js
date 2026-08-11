import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import CategoryEditorModal from '../CategoryEditorModal';
import { presetPacks } from '../../data/presetPacks';

const CategorySettings = () => {
  const { meritCategories, demeritCategories, deleteCategory, reorderCategory, loadPresetPack } =
    useApp();

  const [editing, setEditing] = useState(null); // { category } | { defaultType }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingPack, setPendingPack] = useState(null);
  const [flash, setFlash] = useState(null);

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteCategory(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(current => (current === id ? null : current)), 3000);
    }
  };

  const applyPack = (mode) => {
    const { added, removed } = loadPresetPack(pendingPack.id, mode);
    setPendingPack(null);
    setFlash(
      mode === 'replace'
        ? `Replaced ${removed} categories with ${added} from ${pendingPack.name}.`
        : `Added up to ${added} categories from ${pendingPack.name}.`
    );
    setTimeout(() => setFlash(null), 4000);
  };

  const renderList = (categories, type) => (
    <div className="category-admin-block">
      <div className="section-header">
        <h4>
          {type === 'merit' ? '👍 Merits' : '👎 Demerits'} ({categories.length})
        </h4>
        <button className="add-btn" onClick={() => setEditing({ defaultType: type })}>
          + New {type === 'merit' ? 'Merit' : 'Demerit'}
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="empty-hint">
          No {type === 'merit' ? 'merits' : 'demerits'} yet — cheerleaders can't be given any until
          you add one.
        </p>
      ) : (
        <div className="category-admin-list">
          {categories.map((category, index) => (
            <div key={category.id} className="category-admin-row">
              <div className="reorder-btns">
                <button
                  className="reorder-btn"
                  onClick={() => reorderCategory(category.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="reorder-btn"
                  onClick={() => reorderCategory(category.id, 'down')}
                  disabled={index === categories.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <span className="cat-icon">{category.icon}</span>
              <span className="cat-name">{category.name}</span>
              <span className={`cat-points ${category.points > 0 ? 'positive' : 'negative'}`}>
                {category.points > 0 ? '+' : ''}{category.points}
              </span>
              <div className="row-actions">
                <button
                  className="icon-btn"
                  onClick={() => setEditing({ category })}
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  className={`delete-btn ${confirmDeleteId === category.id ? 'confirm' : ''}`}
                  onClick={() => handleDelete(category.id)}
                >
                  {confirmDeleteId === category.id ? 'Confirm' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="settings-section">
      <h3>Merit &amp; Demerit Categories</h3>
      <p className="settings-hint">
        This is your point system — rename anything, change any value, add your own, or start from a
        preset below. Past awards keep whatever they were given as, so editing a category never
        rewrites history.
      </p>

      {flash && <div className="success-message">{flash}</div>}

      {renderList(meritCategories, 'merit')}
      {renderList(demeritCategories, 'demerit')}

      <div className="preset-pack-area">
        <h4>Start From a Preset</h4>
        <p className="settings-hint">
          A preset is just a starting point — everything stays editable afterwards.
        </p>

        {pendingPack && (
          <div className="confirm-banner">
            <p>
              <strong>{pendingPack.icon} {pendingPack.name}</strong> has{' '}
              {pendingPack.categories.length} categories. Replace your current list, or add these
              alongside it?
            </p>
            <div className="confirm-banner-actions">
              <button className="cancel-btn" onClick={() => setPendingPack(null)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={() => applyPack('append')}>
                Add Alongside
              </button>
              <button className="delete-btn confirm" onClick={() => applyPack('replace')}>
                Replace Everything
              </button>
            </div>
          </div>
        )}

        <div className="preset-pack-grid">
          {presetPacks.map(pack => (
            <button
              key={pack.id}
              className={`preset-pack-card ${pendingPack?.id === pack.id ? 'selected' : ''}`}
              onClick={() => setPendingPack(pack)}
            >
              <span className="pack-icon">{pack.icon}</span>
              <span className="pack-name">{pack.name}</span>
              <span className="pack-description">{pack.description}</span>
              <span className="count">{pack.categories.length} categories</span>
            </button>
          ))}
        </div>
      </div>

      {editing && (
        <CategoryEditorModal
          category={editing.category}
          defaultType={editing.defaultType}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default CategorySettings;
