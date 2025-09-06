import './GameSelection.css'

function GameSelection({ selectedGame, onGameSelect }) {
  const games = [
    {
      id: 'speed-test',
      icon: '⚡',
      title: 'Speed Test',
      description: 'Test how many Hebrew words you can spell per minute!'
    },
    {
      id: 'future-game-2',
      icon: '🎯',
      title: 'Future Game 2',
      description: 'Coming soon...'
    },
    {
      id: 'future-game-3',
      icon: '🧠',
      title: 'Future Game 3',
      description: 'Coming soon...'
    },
    {
      id: 'future-game-4',
      icon: '🏆',
      title: 'Future Game 4',
      description: 'Coming soon...'
    }
  ]

  return (
    <section className="game-selection-section">
      <h2 className="section-title">Choose Game Type</h2>
      <div className="game-tiles-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className={`game-tile ${selectedGame === game.id ? 'selected' : ''}`}
            onClick={() => onGameSelect(game.id)}
          >
            <div className="game-tile-icon">{game.icon}</div>
            <div className="game-tile-content">
              <h3 className="game-tile-title">{game.title}</h3>
              <p className="game-tile-description">{game.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default GameSelection
