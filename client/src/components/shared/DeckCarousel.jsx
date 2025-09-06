import { useState, useEffect, useRef } from 'react'
import './DeckCarousel.css'

function DeckCarousel({ onDeckChange }) {
  const [activeDeck, setActiveDeck] = useState(0)
  const containerRef = useRef(null)
  const decks = [
    {
      id: 1,
      name: 'Default Deck',
      count: 150,
      color: '#667eea',
      icon: '📚'
    },
    {
      id: 2,
      name: 'Beginner',
      count: 120,
      color: '#48bb78',
      icon: '🌱'
    },
    {
      id: 3,
      name: 'Intermediate',
      count: 200,
      color: '#ed8936',
      icon: '📈'
    },
    {
      id: 4,
      name: 'Advanced',
      count: 180,
      color: '#f56565',
      icon: '🔥'
    }
  ]

  // Handle automatic deck selection based on scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.left + containerRect.width / 2

      // Find the card closest to the center
      const cards = container.querySelectorAll('.deck-card')
      let closestIndex = 0
      let closestDistance = Infinity

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect()
        const cardCenter = cardRect.left + cardRect.width / 2
        const distance = Math.abs(cardCenter - containerCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      // Only update if the active deck has changed
      if (closestIndex !== activeDeck) {
        setActiveDeck(closestIndex)
        onDeckChange?.(decks[closestIndex])
      }
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true })

    // Also listen for window resize to recalculate
    window.addEventListener('resize', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [activeDeck, decks, onDeckChange])

  const handleDeckClick = (index) => {
    setActiveDeck(index)
    onDeckChange?.(decks[index])

    // Scroll the clicked card to center
    const container = containerRef.current
    const cards = container.querySelectorAll('.deck-card')
    if (cards[index]) {
      const cardRect = cards[index].getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const scrollLeft = container.scrollLeft + cardRect.left - containerRect.left - (containerRect.width / 2) + (cardRect.width / 2)

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="deck-carousel">
      <div className="deck-container" ref={containerRef}>
        {decks.map((deck, index) => (
          <div
            key={deck.id}
            className={`deck-card ${index === activeDeck ? 'active' : ''}`}
            onClick={() => handleDeckClick(index)}
            style={{
              '--deck-color': deck.color
            }}
          >
            <div className="deck-icon">{deck.icon}</div>
            <div className="deck-info">
              <h4 className="deck-name">{deck.name}</h4>
              <span className="deck-count">{deck.count} words</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeckCarousel
