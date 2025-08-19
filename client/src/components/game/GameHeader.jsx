import './GameHeader.css'

function GameHeader({ score, currentWordIndex, totalWords, onBackToMenu, isCorrect }) {
  return (
    <div className="game-header">
      <button className="back-button" onClick={onBackToMenu} title="Back to Menu">
        ←
      </button>
      <div className="header-info">
        <div className={`score ${isCorrect !== null ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
          Score: {score}
        </div>
        <div className={`progress ${isCorrect !== null ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
          Word {currentWordIndex + 1} of {totalWords}
        </div>
      </div>
    </div>
  )
}

export default GameHeader
