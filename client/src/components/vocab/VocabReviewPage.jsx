import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../config'
import './VocabReviewPage.css'

function VocabReviewPage({ onBackToHome }) {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredWord, setHoveredWord] = useState(null)
  const [touchTimer, setTouchTimer] = useState(null)

  // Sort / Filter state
  const [panelOpen, setPanelOpen] = useState(false)
  const [sortBy, setSortBy] = useState('progress') // progress | alpha | seen | wrong | last_seen
  const [sortDir, setSortDir] = useState('asc') // asc | desc
  const [filterProgress, setFilterProgress] = useState('all') // all | learning | learned
  const [filterNewWithinHours, setFilterNewWithinHours] = useState(null) // e.g., 24

  const fetchProgress = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Not logged in')
        return
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const params = {
        sortBy,
        sortDir,
        progress: filterProgress,
      }
      if (filterNewWithinHours) params.newWithinHours = filterNewWithinHours

      const response = await axios.get(getApiUrl('/progress/list'), { params })
      setProgress(response.data.progress || [])
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir, filterProgress, filterNewWithinHours])

  const getProgressColor = (learnedScore) => {
    if (learnedScore >= 5) return '#48bb78' // Green - learned
    if (learnedScore >= 3) return '#ed8936' // Orange - getting there
    if (learnedScore >= 1) return '#ecc94b' // Yellow - started
    return '#e53e3e' // Red - not started
  }

  const getProgressText = (learnedScore) => {
    if (learnedScore >= 5) return 'Learned'
    if (learnedScore >= 3) return 'Getting There'
    if (learnedScore >= 1) return 'Started'
    return 'Not Started'
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
    <div className="vocab-review-page">
      <div className="vocab-review-container">
        <div className="vocab-review-header">
          <button className="back-button" onClick={onBackToHome} title="Back to Home">
            ←
          </button>
          <h1 className="page-title">Your Words</h1>
        </div>

        {loading && <div className="loading-message">Loading vocabulary progress...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="vocab-list">
            <div className="vocab-stats">
              <div className="stat-item">
                <span className="stat-label">Total Words:</span>
                <span className="stat-value">{progress.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Learned:</span>
                <span className="stat-value">{progress.filter(p => p.learned_score >= 5).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">In Progress:</span>
                <span className="stat-value">{progress.filter(p => p.learned_score < 5 && p.learned_score > 0).length}</span>
              </div>
            </div>

            <div className="controls">
              <button className="filter-toggle" onClick={() => setPanelOpen(!panelOpen)}>
                Sort / Filter
              </button>
              {panelOpen && (
                <div className="filter-panel">
                  <div className="filter-group">
                    <div className="filter-title">Sort by</div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='progress'} onChange={() => setSortBy('progress')} /> Progress</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='alpha'} onChange={() => setSortBy('alpha')} /> Alphabetically</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='seen'} onChange={() => setSortBy('seen')} /> Times seen</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='wrong'} onChange={() => setSortBy('wrong')} /> Wrong</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='last_seen'} onChange={() => setSortBy('last_seen')} /> Last Seen</label>
                    </div>
                    <div className="filter-row">
                      <label className="dir-label">Direction:
                        <select value={sortDir} onChange={(e)=>setSortDir(e.target.value)}>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="filter-group">
                    <div className="filter-title">Filter</div>
                    <div className="filter-row">
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='all'} onChange={() => setFilterProgress('all')} /> All</label>
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='learning'} onChange={() => setFilterProgress('learning')} /> Learning</label>
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='learned'} onChange={() => setFilterProgress('learned')} /> Learned</label>
                    </div>
                    <div className="filter-row">
                      <label className="dir-label">New Words (hours):
                        <input 
                          type="number" 
                          min="0" 
                          placeholder="e.g. 24" 
                          value={filterNewWithinHours ?? ''}
                          onChange={(e)=> setFilterNewWithinHours(e.target.value ? Number(e.target.value) : null)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {progress.length === 0 ? (
              <div className="no-words-message">No vocabulary progress found. Start playing to build your vocabulary!</div>
            ) : (
              <div className="vocab-table-wrapper">
                <table className="vocab-table">
                  <thead>
                    <tr>
                      <th>Hebrew</th>
                      <th>English</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((word) => (
                      <tr 
                        key={word.id}
                        className={hoveredWord?.id === word.id ? 'hovered' : ''}
                        onMouseEnter={() => handleMouseEnter(word)}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={() => handleTouchStart(word)}
                        onTouchEnd={handleTouchEnd}
                      >
                        <td className="hebrew-cell rtl">{word.hebrew}</td>
                        <td className="english-cell">
                          {word.english && word.english.length > 0 ? word.english[0] : ''}
                        </td>
                        <td className="progress-cell">
                          <div className="progress-indicator">
                            <span 
                              className="progress-dot" 
                              style={{ backgroundColor: getProgressColor(word.learned_score) }}
                            ></span>
                            <span className="progress-text">{getProgressText(word.learned_score)}</span>
                          </div>
                          {hoveredWord?.id === word.id && (
                            <div className="word-details">
                              <div className="detail-item">
                                <span className="detail-label">Seen:</span>
                                <span className="detail-value">{word.times_seen}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Wrong:</span>
                                <span className="detail-value">{word.times_wrong}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Last Seen:</span>
                                <span className="detail-value">
                                  {word.last_seen ? new Date(word.last_seen).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VocabReviewPage
