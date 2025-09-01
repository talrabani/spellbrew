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
  const [sortBy, setSortBy] = useState('progress') // progress | difficulty | priority_score | alpha | seen | wrong | last_seen | word_stage
  const [sortDir, setSortDir] = useState('asc') // asc | desc
  const [filterProgress, setFilterProgress] = useState('all') // all | new | learning | practicing | known
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
      
      // First, auto-manage the user's vocabulary (add new words if needed)
      try {
        const autoManageResponse = await axios.post(getApiUrl('/progress/auto-manage'))
        if (autoManageResponse.data.action === 'added_words') {
          console.log(`Auto-added ${autoManageResponse.data.wordsAdded} new words:`, autoManageResponse.data.reason)
        }
      } catch (autoManageError) {
        console.warn('Auto-manage failed, continuing with existing words:', autoManageError)
      }
      
      const params = {
        sortBy,
        sortDir,
        progress: filterProgress,
      }
      if (filterNewWithinHours) params.newWithinHours = filterNewWithinHours

      const response = await axios.get(getApiUrl('/progress/list'), { params })
      setProgress(response.data.progress || [])
    } catch (e) {
      console.error('Error fetching progress:', e)
      setError(e.response?.data?.error || e.message || 'Failed to fetch progress')
      setProgress([]) // Reset progress to prevent rendering issues
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir, filterProgress, filterNewWithinHours])

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
                <span className="stat-label">Known:</span>
                <span className="stat-value">{progress.filter(p => p.word_stage === 'known').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Practicing:</span>
                <span className="stat-value">{progress.filter(p => p.word_stage === 'practicing').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Learning:</span>
                <span className="stat-value">{progress.filter(p => p.word_stage === 'learning').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">New:</span>
                <span className="stat-value">{progress.filter(p => p.word_stage === 'new').length}</span>
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
                      <label><input type="radio" name="sortBy" checked={sortBy==='difficulty'} onChange={() => setSortBy('difficulty')} /> Difficulty</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='priority_score'} onChange={() => setSortBy('priority_score')} /> Priority</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='alpha'} onChange={() => setSortBy('alpha')} /> Alphabetically</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='seen'} onChange={() => setSortBy('seen')} /> Times seen</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='wrong'} onChange={() => setSortBy('wrong')} /> Times wrong</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='last_seen'} onChange={() => setSortBy('last_seen')} /> Last Seen</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='word_stage'} onChange={() => setSortBy('word_stage')} /> Word Stage</label>
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
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='new'} onChange={() => setFilterProgress('new')} /> New</label>
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='learning'} onChange={() => setFilterProgress('learning')} /> Learning</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='practicing'} onChange={() => setFilterProgress('practicing')} /> Practicing</label>
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='known'} onChange={() => setFilterProgress('known')} /> Known</label>
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
                    {progress.filter(word => word && word.id && word.hebrew).map((word) => (
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
                              style={{ backgroundColor: getProgressColor(word.progress_percentage || 0, word.word_stage || 'new') }}
                            ></span>
                            <span className="progress-text">{getProgressText(word.progress_percentage || 0)}</span>
                          </div>
                          {hoveredWord?.id === word.id && (
                            <div className="word-details">
                              <div className="detail-item">
                                <span className="detail-label">Word Stage:</span>
                                <span className="detail-value">
                                  {word.word_stage || 'new'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Difficulty Score:</span>
                                <span className="detail-value">
                                  {typeof word.difficulty === 'number' ? word.difficulty.toFixed(1) : '50.0'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Priority Score:</span>
                                <span className="detail-value">
                                  {typeof word.priority_score === 'number' ? word.priority_score.toFixed(1) : '0.0'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Times Seen:</span>
                                <span className="detail-value">{word.times_seen || 0}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Times Wrong:</span>
                                <span className="detail-value">{word.times_wrong || 0}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Error Rate:</span>
                                <span className="detail-value">
                                  {word.times_seen > 0 
                                    ? `${((word.times_wrong / word.times_seen) * 100).toFixed(1)}%` 
                                    : '0%'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Last Seen:</span>
                                <span className="detail-value">
                                  {word.last_seen ? new Date(word.last_seen).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                              {word.display_time && (
                                <div className="detail-item">
                                  <span className="detail-label">Display Time:</span>
                                  <span className="detail-value">
                                    {word.display_time === null ? 'Unlimited' : `${word.display_time / 1000}s`}
                                  </span>
                                </div>
                              )}
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
