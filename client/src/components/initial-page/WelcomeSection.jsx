import './WelcomeSection.css'

function WelcomeSection() {
  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="welcome-decoration">
            <span className="hebrew-letter">ש</span>
            <span className="hebrew-letter">ל</span>
            <span className="hebrew-letter">ו</span>
            <span className="hebrew-letter">ם</span>
          </div>
          <h2 className="welcome-title">Welcome to Spellbrew</h2>
          <div className="welcome-decoration">
            <span className="hebrew-letter">ם</span>
            <span className="hebrew-letter">ו</span>
            <span className="hebrew-letter">ל</span>
            <span className="hebrew-letter">ש</span>
          </div>
        </div>

        <div className="welcome-message">
          <p className="welcome-text">
            Embark on your Hebrew learning journey with our interactive spelling challenges.
            Master new words, build your vocabulary, and test your skills in fun, engaging ways!
          </p>

          <div className="welcome-features">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Multiple Game Modes</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span className="feature-text">Progressive Learning</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">Speed Challenges</span>
            </div>
          </div>
        </div>

        <div className="welcome-motivation">
          <p className="motivation-text">
            "Every word you learn brings you closer to fluency"
          </p>
          <div className="motivation-decoration">✨📖✨</div>
        </div>
      </div>
    </section>
  )
}

export default WelcomeSection
