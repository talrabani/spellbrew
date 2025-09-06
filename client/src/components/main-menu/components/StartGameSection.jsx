import './StartGameSection.css'

function StartGameSection({ onStartGame, user }) {
  return (
    <section className="start-game-section">
      <button className="start-game-button" onClick={onStartGame}>
        {user ? 'Start Game' : 'Please log in or make an account to play'}
      </button>
    </section>
  )
}

export default StartGameSection
