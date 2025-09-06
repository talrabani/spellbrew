import './EmptyState.css'

function EmptyState({
  icon = '📚',
  title = 'No vocabulary found',
  message = 'Start playing to build your vocabulary!'
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}

export default EmptyState
