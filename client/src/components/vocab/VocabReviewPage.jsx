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
  const [sortBy, setSortBy] = useState('progress') // progress | stability | difficulty | retrievability | reviews | alpha | seen | wrong | last_seen | next_review
  const [sortDir, setSortDir] = useState('asc') // asc | desc
  const [filterProgress, setFilterProgress] = useState('all') // all | learning | reviewing | mastered
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

  const getProgressColor = (progressPercentage, learningStatus) => {
    if (learningStatus === 'mastered') return '#48bb78' // Green - mastered
    if (learningStatus === 'reviewing') return '#ed8936' // Orange - reviewing
    if (learningStatus === 'learning') return '#ecc94b' // Yellow - learning
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
                <span className="stat-label">Mastered:</span>
                <span className="stat-value">{progress.filter(p => p.learning_status === 'mastered').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Reviewing:</span>
                <span className="stat-value">{progress.filter(p => p.learning_status === 'reviewing').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Learning:</span>
                <span className="stat-value">{progress.filter(p => p.learning_status === 'learning').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">New:</span>
                <span className="stat-value">{progress.filter(p => p.learning_status === 'new').length}</span>
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
                      <label><input type="radio" name="sortBy" checked={sortBy==='stability'} onChange={() => setSortBy('stability')} /> Stability</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='difficulty'} onChange={() => setSortBy('difficulty')} /> Difficulty</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='retrievability'} onChange={() => setSortBy('retrievability')} /> Retrievability</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='reviews'} onChange={() => setSortBy('reviews')} /> Reviews</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='alpha'} onChange={() => setSortBy('alpha')} /> Alphabetically</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='seen'} onChange={() => setSortBy('seen')} /> Times seen</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='wrong'} onChange={() => setSortBy('wrong')} /> Wrong</label>
                      <label><input type="radio" name="sortBy" checked={sortBy==='last_seen'} onChange={() => setSortBy('last_seen')} /> Last Seen</label>
                    </div>
                    <div className="filter-row">
                      <label><input type="radio" name="sortBy" checked={sortBy==='next_review'} onChange={() => setSortBy('next_review')} /> Next Review</label>
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
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='reviewing'} onChange={() => setFilterProgress('reviewing')} /> Reviewing</label>
                      <label><input type="radio" name="progressFilter" checked={filterProgress==='mastered'} onChange={() => setFilterProgress('mastered')} /> Mastered</label>
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
                              style={{ backgroundColor: getProgressColor(word.progress_percentage || 0, word.learning_status || 'new') }}
                            ></span>
                            <span className="progress-text">{getProgressText(word.progress_percentage || 0)}</span>
                          </div>
                          {hoveredWord?.id === word.id && (
                            <div className="word-details">
                              <div className="detail-item">
                                <span className="detail-label">Stability:</span>
                                <span className="detail-value">
                                  {typeof word.fsrs_stability === 'number' ? word.fsrs_stability.toFixed(2) : '0.10'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Difficulty:</span>
                                <span className="detail-value">
                                  {typeof word.fsrs_difficulty === 'number' ? word.fsrs_difficulty.toFixed(2) : '5.00'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Reviews:</span>
                                <span className="detail-value">{word.fsrs_review_count || 0}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Seen:</span>
                                <span className="detail-value">{word.times_seen || 0}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Wrong:</span>
                                <span className="detail-value">{word.times_wrong || 0}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Last Seen:</span>
                                <span className="detail-value">
                                  {word.last_seen ? new Date(word.last_seen).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                              {word.fsrs_next_review && (
                                <div className="detail-item">
                                  <span className="detail-label">Next Review:</span>
                                  <span className="detail-value">
                                    {word.days_until_next_review > 0 
                                      ? `${word.days_until_next_review} days` 
                                      : 'Due now'}
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
