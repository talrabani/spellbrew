import './WordDetailsTooltip.css'

function WordDetailsTooltip({ word }) {
  const errorRate = word.times_seen > 0
    ? `${((word.times_wrong / word.times_seen) * 100).toFixed(1)}%`
    : '0%'

  return (
    <div className="word-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-stage">{word.word_stage || 'new'}</span>
        <span className="tooltip-hebrew">{word.hebrew}</span>
      </div>

      <div className="tooltip-grid">
        <div className="tooltip-stat">
          <span className="stat-label">Seen</span>
          <span className="stat-value">{word.times_seen || 0}</span>
        </div>
        <div className="tooltip-stat">
          <span className="stat-label">Wrong</span>
          <span className="stat-value">{word.times_wrong || 0}</span>
        </div>
        <div className="tooltip-stat">
          <span className="stat-label">Error Rate</span>
          <span className="stat-value">{errorRate}</span>
        </div>
        <div className="tooltip-stat">
          <span className="stat-label">Difficulty</span>
          <span className="stat-value">
            {typeof word.difficulty === 'number' ? word.difficulty.toFixed(1) : '50.0'}
          </span>
        </div>
      </div>

      {word.last_seen && (
        <div className="tooltip-footer">
          <span className="last-seen">
            Last seen: {new Date(word.last_seen).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  )
}

export default WordDetailsTooltip
