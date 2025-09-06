import './WordDetailsTooltip.css'

function WordDetailsTooltip({ word }) {
  return (
    <div className="word-details-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-title">{word.hebrew}</span>
      </div>
      <div className="tooltip-content">
        <div className="detail-row">
          <span className="detail-label">Stage:</span>
          <span className="detail-value">{word.word_stage || 'new'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Difficulty:</span>
          <span className="detail-value">
            {typeof word.difficulty === 'number' ? word.difficulty.toFixed(1) : '50.0'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Priority:</span>
          <span className="detail-value">
            {typeof word.priority_score === 'number' ? word.priority_score.toFixed(1) : '0.0'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Seen:</span>
          <span className="detail-value">{word.times_seen || 0}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Wrong:</span>
          <span className="detail-value">{word.times_wrong || 0}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Error Rate:</span>
          <span className="detail-value">
            {word.times_seen > 0
              ? `${((word.times_wrong / word.times_seen) * 100).toFixed(1)}%`
              : '0%'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Last Seen:</span>
          <span className="detail-value">
            {word.last_seen ? new Date(word.last_seen).toLocaleDateString() : 'Never'}
          </span>
        </div>
        {word.display_time && (
          <div className="detail-row">
            <span className="detail-label">Display Time:</span>
            <span className="detail-value">
              {word.display_time === null ? 'Unlimited' : `${word.display_time / 1000}s`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default WordDetailsTooltip
