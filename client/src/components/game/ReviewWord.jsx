import './ReviewWord.css'

function ReviewWord({ isCorrect, correctWord, userInput, english, transliteration }) {
  return (
    <div className="result-display">
      <div className={`result-text ${isCorrect ? 'correct-text' : 'incorrect-text'}`}>
        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
      </div>
      <div className="word-comparison">
        <div>Correct word: <span className="correct-word">{correctWord}</span></div>
        <div>Your answer: <span className="user-word">{userInput}</span></div>
        <div>English: <span className="english-text">{english}</span></div>
        <div>Transliteration: <span className="transliteration-text">{transliteration}</span></div>
      </div>
    </div>
  )
}

export default ReviewWord
