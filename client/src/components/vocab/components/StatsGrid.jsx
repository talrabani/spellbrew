import './StatsGrid.css'

function StatsGrid({ progress }) {
  const statItems = [
    { label: 'Total Words', value: progress.length, color: '#4a5568' },
    { label: 'Known', value: progress.filter(p => p.word_stage === 'known').length, color: '#48bb78' },
    { label: 'Practicing', value: progress.filter(p => p.word_stage === 'practicing').length, color: '#ed8936' },
    { label: 'Learning', value: progress.filter(p => p.word_stage === 'learning').length, color: '#ecc94b' },
    { label: 'New', value: progress.filter(p => p.word_stage === 'new').length, color: '#e53e3e' }
  ]

  return (
    <div className="stats-grid">
      {statItems.map((stat, index) => (
        <div key={stat.label} className="stat-card" style={{ '--delay': `${index * 0.1}s` }}>
          <div className="stat-value" style={{ color: stat.color }}>
            {stat.value}
          </div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default StatsGrid
