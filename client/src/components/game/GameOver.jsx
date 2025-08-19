import './GameOver.css'

function GameOver({ score, wordsCorrect, totalWords, wordsPerMinute, onPlayAgain }) {
  const accuracy = totalWords > 0 ? Math.round((wordsCorrect / totalWords) * 100) : 0

  return (
    <div className="game-over">
      <h2>Game Over!</h2>
      <div className="final-stats">
        <div className="stat">Final Score: {score}</div>
        <div className="stat">Words Correct: {wordsCorrect} / {totalWords}</div>
        <div className="stat">Accuracy: {accuracy}%</div>
        <div className="stat highlight">Speed: {wordsPerMinute} words/minute</div>
      </div>
      <button className="play-button" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  )
}

export default GameOver
