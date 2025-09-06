import './ErrorState.css'

function ErrorState({ error }) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
    </div>
  )
}

export default ErrorState
