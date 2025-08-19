import './ResultDisplay.css'

function ResultDisplay({ isCorrect, correctWord, userInput }) {
  return (
    <div className="result-display">
      <div className={`result-text ${isCorrect ? 'correct-text' : 'incorrect-text'}`}>
        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
      </div>
      <div className="word-comparison">
        <div>Correct word: <span className="correct-word">{correctWord}</span></div>
        <div>Your answer: <span className="user-word">{userInput}</span></div>
      </div>
    </div>
  )
}

export default ResultDisplay
