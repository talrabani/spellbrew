import './StatsGrid.css'

function StatsGrid({ progress }) {
  const totalWords = {
    label: 'Total Words',
    value: progress.length,
    color: '#4a5568',
    icon: '📚',
    bgColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  }

  const otherStats = [
    {
      label: 'Known',
      value: progress.filter(p => p.word_stage === 'known').length,
      color: '#48bb78',
      icon: '✅',
      bgColor: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)'
    },
    {
      label: 'Practicing',
      value: progress.filter(p => p.word_stage === 'practicing').length,
      color: '#ed8936',
      icon: '🔄',
      bgColor: 'linear-gradient(135deg, #fffaf0 0%, #fed7aa 100%)'
    },
    {
      label: 'Learning',
      value: progress.filter(p => p.word_stage === 'learning').length,
      color: '#ecc94b',
      icon: '📖',
      bgColor: 'linear-gradient(135deg, #ffffe0 0%, #fef3c7 100%)'
    },
    {
      label: 'New',
      value: progress.filter(p => p.word_stage === 'new').length,
      color: '#e53e3e',
      icon: '🆕',
      bgColor: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
    }
  ]

  return (
    <div className="stats-section">
      <h2 className="stats-title">Vocabulary Progress</h2>

      {/* Unified 2x3 Grid Layout */}
      <div className="stats-grid-unified">
        {/* Total Words - spans full first row */}
        <div
          className="stat-tile stat-tile-total"
          style={{
            '--delay': '0s',
            '--tile-bg': totalWords.bgColor
          }}
        >
          <div className="stat-icon">{totalWords.icon}</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: totalWords.color }}>
              {totalWords.value}
            </div>
            <div className="stat-label">{totalWords.label}</div>
          </div>
        </div>

        {/* Other Stats - 2x2 grid below */}
        {otherStats.map((stat, index) => (
          <div
            key={stat.label}
            className="stat-tile"
            style={{
              '--delay': `${(index + 1) * 0.1}s`,
              '--tile-bg': stat.bgColor
            }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsGrid
