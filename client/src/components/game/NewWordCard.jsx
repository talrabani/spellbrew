import './NewWordCard.css'

function NewWordCard({ word, english, transliteration, onContinue }) {
  return (
    <div className="new-word-card">
      <div className="new-word-header">
        <div className="new-word-badge">New Word!</div>
      </div>
      
      <div className="new-word-content">
        <div className="new-word-hebrew">{word}</div>
        
        <div className="new-word-details">
          <div className="detail-row">
            <span className="detail-label">English:</span>
            <span className="detail-value">{english}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Transliteration:</span>
            <span className="detail-value">{transliteration}</span>
          </div>
        </div>
      </div>

      <button className="continue-button" onClick={onContinue}>
        Tap to continue
      </button>
    </div>
  )
}

export default NewWordCard
