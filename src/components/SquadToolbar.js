import React from 'react';

export const SORT_OPTIONS = [
  { id: 'points-desc', label: 'Most points' },
  { id: 'points-asc', label: 'Fewest points' },
  { id: 'name-asc', label: 'Name (A–Z)' },
  { id: 'recent', label: 'Recent activity' },
];

const SquadToolbar = ({
  search,
  onSearch,
  sortBy,
  onSort,
  groupFilter,
  onGroupFilter,
  groups,
  selectMode,
  onToggleSelectMode,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onBulkMerit,
  onBulkDemerit,
  visibleCount,
}) => (
  <div className="squad-toolbar-wrap">
    <div className="squad-toolbar">
      <input
        type="search"
        className="toolbar-search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search cheerleaders..."
      />
      <select className="toolbar-select" value={sortBy} onChange={(e) => onSort(e.target.value)}>
        {SORT_OPTIONS.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        className={`select-mode-btn ${selectMode ? 'active' : ''}`}
        onClick={onToggleSelectMode}
      >
        {selectMode ? 'Done' : '☑️ Select'}
      </button>
    </div>

    {groups.length > 0 && (
      <div className="group-filter-chips">
        <button
          className={`group-chip ${!groupFilter ? 'active' : ''}`}
          onClick={() => onGroupFilter(null)}
        >
          Everyone
        </button>
        {groups.map(group => (
          <button
            key={group.id}
            className={`group-chip ${groupFilter === group.id ? 'active' : ''}`}
            style={
              groupFilter === group.id
                ? { background: group.color, borderColor: group.color, color: '#fff' }
                : { borderColor: group.color, color: group.color }
            }
            onClick={() => onGroupFilter(groupFilter === group.id ? null : group.id)}
          >
            {group.icon} {group.name}
          </button>
        ))}
      </div>
    )}

    {selectMode && (
      <div className="select-mode-bar">
        <span className="selected-count">
          {selectedIds.length} of {visibleCount} selected
        </span>
        <div className="bulk-actions">
          <button className="cancel-btn" onClick={onSelectAll}>
            Select all shown
          </button>
          <button className="cancel-btn" onClick={onClearSelection} disabled={selectedIds.length === 0}>
            Clear
          </button>
          <button className="merit-btn wide" onClick={onBulkMerit} disabled={selectedIds.length === 0}>
            + Award Merit
          </button>
          <button
            className="demerit-btn wide"
            onClick={onBulkDemerit}
            disabled={selectedIds.length === 0}
          >
            − Give Demerit
          </button>
        </div>
      </div>
    )}
  </div>
);

export default SquadToolbar;
