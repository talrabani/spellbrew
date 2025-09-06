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
      {/* Direction Selector at Top */}
      <div className="filter-top-section">
        <div className="sort-direction">
          <span className="direction-label">Direction:</span>
          <button
            className="direction-toggle"
            onClick={() => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')}
            aria-label={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
          >
            <span className="direction-text">
              {sortDir === 'asc' ? 'Ascending' : 'Descending'}
            </span>
            <span className={`direction-arrow ${sortDir === 'asc' ? 'up' : 'down'}`}>
              {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content - Sort Left, Filter Right */}
      <div className="filter-main-content">
        {/* Left Side - Sorting Options */}
        <div className="filter-left">
          <h4 className="filter-column-title">Sort by</h4>
          <div className="sort-options-list">
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
                checked={sortBy === 'alpha'}
                onChange={() => onSortByChange('alpha')}
              />
              <span className="radio-label">Alphabetical</span>
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
            <label className="radio-option">
              <input
                type="radio"
                name="sortBy"
                checked={sortBy === 'last_seen'}
                onChange={() => onSortByChange('last_seen')}
              />
              <span className="radio-label">Last Seen</span>
            </label>
          </div>
        </div>

        {/* Right Side - Filtering Options */}
        <div className="filter-right">
          <h4 className="filter-column-title">Filter by Progress</h4>
          <div className="filter-options-list">
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
