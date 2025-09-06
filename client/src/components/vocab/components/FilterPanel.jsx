import './FilterPanel.css'

function FilterPanel({
  panelOpen,
  sortBy,
  sortDir,
  filterProgress,
  onSortByChange,
  onSortDirChange,
  onFilterProgressChange
}) {
  if (!panelOpen) return null

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3 className="filter-section-title">Sort by</h3>
        <div className="filter-options">
          <div className="filter-group">
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'progress'}
                onChange={() => onSortByChange('progress')}
              />
              <span className="radio-label">Progress</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'difficulty'}
                onChange={() => onSortByChange('difficulty')}
              />
              <span className="radio-label">Difficulty</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'priority_score'}
                onChange={() => onSortByChange('priority_score')}
              />
              <span className="radio-label">Priority</span>
            </label>
          </div>
          <div className="filter-group">
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'alpha'}
                onChange={() => onSortByChange('alpha')}
              />
              <span className="radio-label">Alphabetical</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'seen'}
                onChange={() => onSortByChange('seen')}
              />
              <span className="radio-label">Times Seen</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'wrong'}
                onChange={() => onSortByChange('wrong')}
              />
              <span className="radio-label">Times Wrong</span>
            </label>
          </div>
          <div className="filter-group">
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'last_seen'}
                onChange={() => onSortByChange('last_seen')}
              />
              <span className="radio-label">Last Seen</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'word_stage'}
                onChange={() => onSortByChange('word_stage')}
              />
              <span className="radio-label">Word Stage</span>
            </label>
            <div className="sort-direction">
              <span className="direction-label">Direction:</span>
              <select value={sortDir} onChange={(e) => onSortDirChange(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Filter by Progress</h3>
        <div className="filter-options">
          <div className="filter-group">
            <label className="radio-option">
              <input
                type="radio"
                name="progressFilter"
                checked={filterProgress === 'all'}
                onChange={() => onFilterProgressChange('all')}
              />
              <span className="radio-label">All Words</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="progressFilter"
                checked={filterProgress === 'new'}
                onChange={() => onFilterProgressChange('new')}
              />
              <span className="radio-label">New</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="progressFilter"
                checked={filterProgress === 'learning'}
                onChange={() => onFilterProgressChange('learning')}
              />
              <span className="radio-label">Learning</span>
            </label>
          </div>
          <div className="filter-group">
            <label className="radio-option">
              <input
                type="radio"
                name="progressFilter"
                checked={filterProgress === 'practicing'}
                onChange={() => onFilterProgressChange('practicing')}
              />
              <span className="radio-label">Practicing</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="progressFilter"
                checked={filterProgress === 'known'}
                onChange={() => onFilterProgressChange('known')}
              />
              <span className="radio-label">Known</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
