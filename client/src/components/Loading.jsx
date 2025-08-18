import './Loading.css'

function Loading({ message = "Loading words..." }) {
  return (
    <div className="loading-container">
      <div className="loading">{message}</div>
    </div>
  )
}

export default Loading
