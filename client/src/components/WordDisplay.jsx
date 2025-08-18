import './WordDisplay.css'

function WordDisplay({ word, instruction }) {
  return (
    <div className="word-display-container">
      {word && (
        <div className="word-display">
          {word}
        </div>
      )}
      {instruction && (
        <div className="instruction">
          {instruction}
        </div>
      )}
    </div>
  )
}

export default WordDisplay
