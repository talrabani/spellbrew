import { useState } from 'react'
import WordDetailsTooltip from './WordDetailsTooltip'
import './VocabularyTable.css'

function VocabularyTable({ progress }) {
  const [hoveredWord, setHoveredWord] = useState(null)
  const [touchTimer, setTouchTimer] = useState(null)

  const getProgressColor = (progressPercentage, wordStage) => {
    if (wordStage === 'known') return '#48bb78' // Green - known
    if (wordStage === 'practicing') return '#ed8936' // Orange - practicing
    if (wordStage === 'learning') return '#ecc94b' // Yellow - learning
    return '#e53e3e' // Red - new
  }

  const getProgressText = (progressPercentage) => {
    return `${progressPercentage}%`
  }

  const handleMouseEnter = (word) => {
    setHoveredWord(word)
  }

  const handleMouseLeave = () => {
    setHoveredWord(null)
  }

  const handleTouchStart = (word) => {
    const timer = setTimeout(() => {
      setHoveredWord(word)
    }, 500) // 500ms hold
    setTouchTimer(timer)
  }

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      setTouchTimer(null)
    }
    // Keep the hover state for a moment after touch ends
    setTimeout(() => {
      setHoveredWord(null)
    }, 1000)
  }

  return (
    <div className="table-container">
      <div className="table-scroll-wrapper">
        <table className="vocab-table">
          <thead className="table-header">
            <tr>
              <th className="hebrew-header">Hebrew</th>
              <th className="english-header">English</th>
              <th className="progress-header">Progress</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {progress.filter(word => word && word.id && word.hebrew).map((word) => (
              <tr
                key={word.id}
                className={`table-row ${hoveredWord?.id === word.id ? 'hovered' : ''}`}
                onMouseEnter={() => handleMouseEnter(word)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={() => handleTouchStart(word)}
                onTouchEnd={handleTouchEnd}
              >
                <td className="hebrew-cell">
                  <span className="hebrew-text rtl">{word.hebrew}</span>
                </td>
                <td className="english-cell">
                  <span className="english-text">
                    {word.english && word.english.length > 0 ? word.english[0] : ''}
                  </span>
                </td>
                <td className="progress-cell">
                  <div className="progress-indicator">
                    <span
                      className="progress-dot"
                      style={{ backgroundColor: getProgressColor(word.progress_percentage || 0, word.word_stage || 'new') }}
                      title={`${word.word_stage || 'new'} - ${getProgressText(word.progress_percentage || 0)}`}
                    ></span>
                    <span className="progress-text">{getProgressText(word.progress_percentage || 0)}</span>
                  </div>
                  {hoveredWord?.id === word.id && (
                    <WordDetailsTooltip word={word} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VocabularyTable
