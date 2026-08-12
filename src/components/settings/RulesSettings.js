import React from 'react';
import { useApp } from '../../contexts/AppContext';

// Squad-wide rules. Saved as they change — a Save button here would be one more
// thing to forget, and every setting is individually reversible.
const RulesSettings = () => {
  const { squadRules, updateSquadRules } = useApp();

  const Toggle = ({ on, onClick }) => (
    <button
      type="button"
      className={`toggle-switch ${on ? 'on' : ''}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
    >
      <span className="toggle-knob" />
    </button>
  );

  return (
    <div className="settings-section">
      <h3>Squad Rules</h3>
      <p className="settings-hint">
        These apply to every award, whether you give it from a card or in bulk.
      </p>

      <div className="setting-row">
        <div className="setting-label">
          <strong>Allow negative totals</strong>
          <small>
            When off, a demerit can only take a cheerleader down to 0 — the rest is dropped
            instead of pushing her negative.
          </small>
        </div>
        <Toggle
          on={squadRules.allowNegativeTotals}
          onClick={() => updateSquadRules({ allowNegativeTotals: !squadRules.allowNegativeTotals })}
        />
      </div>

      <div className="setting-row">
        <div className="setting-label">
          <strong>Require a note on demerits</strong>
          <small>
            Demerits won't save without a short explanation. Parents and cheerleaders both see the
            note.
          </small>
        </div>
        <Toggle
          on={squadRules.requireNoteOnDemerits}
          onClick={() =>
            updateSquadRules({ requireNoteOnDemerits: !squadRules.requireNoteOnDemerits })
          }
        />
      </div>

      <div className="setting-row">
        <div className="setting-label">
          <strong>Daily point limit</strong>
          <small>
            Most points one cheerleader can be given in a single day, counting merits and demerits
            together and ignoring the sign. An award that would go over is trimmed to what's left.
            Set to 0 for no limit.
          </small>
        </div>
        <input
          type="number"
          className="toolbar-select cap-input"
          min={0}
          max={500}
          value={squadRules.dailyPointCap}
          onChange={(e) => updateSquadRules({ dailyPointCap: e.target.value })}
        />
      </div>
    </div>
  );
};

export default RulesSettings;
