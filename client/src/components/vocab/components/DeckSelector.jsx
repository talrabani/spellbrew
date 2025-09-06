import { useState } from 'react'
import './DeckSelector.css'

function DeckSelector({ onDeckChange }) {
  const [activeDeck, setActiveDeck] = useState(0)

  // Placeholder deck data
  const decks = [
    { id: 1, name: 'Basic Words', count: 150, color: '#667eea' },
    { id: 2, name: 'Intermediate', count: 200, color: '#764ba2' },
    { id: 3, name: 'Advanced', count: 180, color: '#f093fb' },
    { id: 4, name: 'Technical', count: 120, color: '#4facfe' },
  ]

  const handleDeckClick = (index) => {
    setActiveDeck(index)
    onDeckChange?.(decks[index])
  }

  return (
    <div className="deck-selector">
      <h3 className="deck-title">Vocabulary Decks</h3>
      <div className="deck-carousel">
        <div className="deck-container">
          {decks.map((deck, index) => (
            <div
              key={deck.id}
              className={`deck-card ${index === activeDeck ? 'active' : ''}`}
              onClick={() => handleDeckClick(index)}
              style={{
                '--deck-color': deck.color,
                '--deck-index': index - activeDeck
              }}
            >
              <div className="deck-icon">📚</div>
              <div className="deck-info">
                <h4 className="deck-name">{deck.name}</h4>
                <span className="deck-count">{deck.count} words</span>
              </div>
            </div>
          ))}
        </div>
        <div className="deck-indicators">
          {decks.map((_, index) => (
            <button
              key={index}
              className={`deck-indicator ${index === activeDeck ? 'active' : ''}`}
              onClick={() => handleDeckClick(index)}
              aria-label={`Select deck ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default DeckSelector
