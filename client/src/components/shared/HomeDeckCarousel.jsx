import './HomeDeckCarousel.css'

function HomeDeckCarousel({ selectedDeck, onDeckSelect }) {
  const decks = [
    {
      id: 'default',
      icon: '📚',
      title: 'Default Deck',
      description: 'Standard Hebrew vocabulary'
    },
    {
      id: 'beginner',
      icon: '🌱',
      title: 'Beginner',
      description: 'Easy words for beginners'
    },
    {
      id: 'intermediate',
      icon: '📈',
      title: 'Intermediate',
      description: 'Medium difficulty words'
    },
    {
      id: 'advanced',
      icon: '🔥',
      title: 'Advanced',
      description: 'Challenging vocabulary'
    }
  ]

  return (
    <div className="home-deck-carousel">
      <div className="home-deck-carousel-container">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className={`home-deck-card ${selectedDeck === deck.id ? 'selected' : ''}`}
            onClick={() => onDeckSelect(deck.id)}
          >
            <div className="home-deck-card-icon">{deck.icon}</div>
            <h4 className="home-deck-card-title">{deck.title}</h4>
            <p className="home-deck-card-description">{deck.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomeDeckCarousel
