import './LoadingState.css'

function LoadingState({ message = 'Loading your vocabulary progress...' }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  )
}

export default LoadingState
