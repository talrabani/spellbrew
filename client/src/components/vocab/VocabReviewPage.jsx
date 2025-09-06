import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../config'
import {
  StatsGrid,
  FilterPanel,
  VocabularyTable,
  LoadingState,
  ErrorState,
  EmptyState,
  DeckSelector
} from './components'
import { CreateDeckSection } from '../main-menu/components'
import './VocabReviewPage.css'

function VocabReviewPage({ onBackToHome }) {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sort / Filter state
  const [panelOpen, setPanelOpen] = useState(false)
  const [sortBy, setSortBy] = useState('progress')
  const [sortDir, setSortDir] = useState('asc')
  const [filterProgress, setFilterProgress] = useState('all')

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

      const response = await axios.get(getApiUrl('/progress/list'), { params })
      setProgress(response.data.progress || [])
    } catch (e) {
      console.error('Error fetching progress:', e)
      setError(e.response?.data?.error || e.message || 'Failed to fetch progress')
      setProgress([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir, filterProgress])

  return (
    <div className="vocab-review-page">
      {/* Header */}
      <header className="page-header">
          <button className="back-button" onClick={onBackToHome} title="Back to Home">
            ←
          </button>
        <h1 className="page-title">Vocabulary Review</h1>
      </header>

      <div className="page-content">
        {loading && <LoadingState />}

        {error && <ErrorState error={error} />}

        {!loading && !error && (
          <>
            {/* Statistics Section */}
            <StatsGrid progress={progress} />

            {/* Deck Selector */}
            <DeckSelector onDeckChange={(deck) => console.log('Selected deck:', deck)} />

            {/* Create New Deck Section */}
            <CreateDeckSection />

            {/* Controls Section */}
            <section className="controls-section">
              <button
                className={`filter-toggle ${panelOpen ? 'active' : ''}`}
                onClick={() => setPanelOpen(!panelOpen)}
              >
                <span className="filter-icon">⚙️</span>
                Sort & Filter
              </button>

              <FilterPanel
                panelOpen={panelOpen}
                sortBy={sortBy}
                sortDir={sortDir}
                filterProgress={filterProgress}
                onSortByChange={setSortBy}
                onSortDirChange={setSortDir}
                onFilterProgressChange={setFilterProgress}
              />
            </section>

            {/* Main Table Section */}
            <section className="table-section">
              {progress.length === 0 ? (
                <EmptyState />
              ) : (
                <VocabularyTable progress={progress} />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default VocabReviewPage
