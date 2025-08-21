import { useState, useEffect } from 'react'
import './WordDisplay.css'

function WordDisplay({ word, instruction, displayTime = 1500 }) {
  const [timeLeft, setTimeLeft] = useState(displayTime)

  useEffect(() => {
    if (!word || displayTime <= 0) return

    setTimeLeft(displayTime)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) return 0
        return prev - 100
      })
    }, 100)

    return () => clearInterval(interval)
  }, [word, displayTime])

  const progressPercentage = displayTime > 0 ? ((displayTime - timeLeft) / displayTime) * 100 : 0

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
      <div className="countdown-container">
        <div className="countdown-bar">
          <div 
            className="countdown-progress" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="countdown-text">
          {(timeLeft / 1000).toFixed(1)}s
        </div>
      </div>
    </div>
  )
}

export default WordDisplay
