import React, { useState } from 'react';
import CategorySettings from './CategorySettings';
import TierSettings from './TierSettings';
import GroupSettings from './GroupSettings';
import RulesSettings from './RulesSettings';
import SeasonSettings from './SeasonSettings';

const SECTIONS = [
  { id: 'categories', label: '🏷️ Categories', Component: CategorySettings },
  { id: 'tiers', label: '🏆 Reward Tiers', Component: TierSettings },
  { id: 'groups', label: '👯 Groups', Component: GroupSettings },
  { id: 'rules', label: '⚖️ Rules', Component: RulesSettings },
  { id: 'season', label: '📅 Season', Component: SeasonSettings },
];

const SettingsPanel = () => {
  const [section, setSection] = useState('categories');
  const Active = SECTIONS.find(s => s.id === section).Component;

  return (
    <div className="settings-panel">
      <nav className="settings-nav">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`settings-tab ${section === s.id ? 'active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <Active />
    </div>
  );
};

export default SettingsPanel;
