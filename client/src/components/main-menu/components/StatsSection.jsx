import './StatsSection.css'

function StatsSection() {
  return (
    <section className="stats-section">
      <h2 className="stats-title">Your Progress</h2>
      <div className="stats-placeholder">
        <div className="stat-tile">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">--</div>
            <div className="stat-label">Words Learned</div>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">--</div>
            <div className="stat-label">Best Score</div>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">--</div>
            <div className="stat-label">Accuracy</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StatsSection
