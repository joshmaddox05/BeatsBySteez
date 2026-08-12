import React from 'react';
import { useApp } from '../contexts/AppContext';

export const POSITION_OPTIONS = ['', 'Flyer', 'Base', 'Backspot', 'Frontspot', 'Tumbler', 'Dancer'];

// A stored value that is no longer in the list still needs to be selectable, or
// opening the editor would silently wipe it.
const withCurrent = (options, value) =>
  value && !options.includes(value) ? [...options, value] : options;

// Position / groups / notes. Shared so adding a cheerleader and editing one
// offer exactly the same fields.
const CheerleaderFields = ({ position, onPosition, notes, onNotes, groupIds, onToggleGroup }) => {
  const { groups } = useApp();

  return (
    <>
      <div className="form-group">
        <label>Position</label>
        <select value={position} onChange={(e) => onPosition(e.target.value)}>
          {withCurrent(POSITION_OPTIONS, position).map(option => (
            <option key={option || 'none'} value={option}>
              {option || '— none —'}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Groups</label>
        {groups.length === 0 ? (
          <small className="settings-hint">
            No groups yet — create them in Settings → Groups.
          </small>
        ) : (
          <div className="member-picker">
            {groups.map(group => (
              <button
                key={group.id}
                type="button"
                className={`member-option ${groupIds.includes(group.id) ? 'selected' : ''}`}
                onClick={() => onToggleGroup(group.id)}
              >
                <span className="member-avatar">{group.icon}</span>
                <span className="member-name">{group.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Coach notes (private)</label>
        <textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Only you see this — injuries, goals, anything worth remembering."
          rows={3}
        />
      </div>
    </>
  );
};

export default CheerleaderFields;
