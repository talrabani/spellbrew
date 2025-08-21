import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../config'
import { GameHeader, Loading, WordDisplay, InputForm, ReviewWord, GameOver } from './index'
import './GamePage.css'

function GamePage({ onBackToMenu }) {
  // Game states: 'loading', 'showing', 'input', 'flash', 'review', 'gameOver'
  const [gameState, setGameState] = useState('loading')
  const [words, setWords] = useState([])
  const [wordDetails, setWordDetails] = useState([]) // Store full word details including English and transliteration
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState('')
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [wordsCorrect, setWordsCorrect] = useState(0)
  const [isCorrect, setIsCorrect] = useState(null)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [showReviewButton, setShowReviewButton] = useState(false)
  const [wordsPerMinute, setWordsPerMinute] = useState(0)
  const [lastTestedWord, setLastTestedWord] = useState('') // Store the word that was being tested
  const [lastTestedWordDetails, setLastTestedWordDetails] = useState(null) // Store the full details of the tested word
  const [gameResults, setGameResults] = useState([]) // Track results for FSRS progress
  const [wordDisplayTimes, setWordDisplayTimes] = useState({}) // Store display times for each word
  const hasInitialized = useRef(false)

  // Normalize Hebrew text for comparison
  const normalizeHebrew = (text) => {
    return text.trim().replace(/\s+/g, ' ')
  }

  // Calculate display time for a word based on FSRS stability
  const calculateDisplayTime = (stability) => {
    // Convert stability to a number and clamp it
    const stabilityNum = Math.max(0.1, Math.min(10, parseFloat(stability) || 0.1))
    
    // Map stability to display time:
    // - New words (stability ~0.1): 3 seconds
    // - Learning words (stability ~0.5): 2 seconds  
    // - Reviewing words (stability ~1-2): 1.5 seconds
    // - Well-known words (stability ~3-5): 1 second
    // - Mastered words (stability ~5+): 0.2 seconds
    if (stabilityNum <= 0.3) return 3000 // 3 seconds for very new words
    if (stabilityNum <= 0.8) return 2000 // 2 seconds for learning words
    if (stabilityNum <= 2.0) return 1500 // 1.5 seconds for reviewing words
    if (stabilityNum <= 4.0) return 1000 // 1 second for well-known words
    return 200 // 0.2 seconds for mastered words
  }

  // Save FSRS progress for a single word
  const saveFSRSProgress = async (hebrew, correct) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found for FSRS progress')
        return
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      await axios.post(getApiUrl('/progress/batch'), {
        results: [{ hebrew, correct }]
      })
      
      console.log(`FSRS progress saved for word: ${hebrew} (${correct ? 'correct' : 'incorrect'})`)
    } catch (error) {
      console.error('Error saving FSRS progress:', error)
    }
  }

  // Fetch words from backend
  const fetchWords = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found')
        return { success: false, words: [] }
      }

      // Set auth header
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
      
      // Fetch words from user's vocabulary
      const response = await axios.get(getApiUrl('/words/user?count=20'))
      const fetchedWords = response.data.words
      const fetchedDetails = response.data.details
      
      // Shuffle the words and details arrays together
      const shuffledIndices = Array.from({ length: fetchedWords.length }, (_, i) => i)
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]]
      }
      
      const shuffledWords = shuffledIndices.map(i => fetchedWords[i])
      const shuffledDetails = shuffledIndices.map(i => fetchedDetails[i])
      
      setWords(shuffledWords)
      setWordDetails(shuffledDetails)
      console.log('Fetched and shuffled user words:', shuffledWords)
      console.log('Fetched and shuffled word details:', shuffledDetails)
      return { success: true, words: shuffledWords, details: shuffledDetails }
    } catch (error) {
      console.error('Error fetching user words:', error)
      return { success: false, words: [] }
    }
  }

  // Initialize game when component mounts
  useEffect(() => {
    if (hasInitialized.current) return
    
    const initializeGame = async () => {
      hasInitialized.current = true
      console.log('Initializing game...')
      
      // Reset all state first
      setCurrentWordIndex(0)
      setCurrentWord('')
      setUserInput('')
      setScore(0)
      setWordsCorrect(0)
      setIsCorrect(null)
      setShowReviewButton(false)
      setLastTestedWord('')
      setLastTestedWordDetails(null)
      setGameResults([])
      
      const result = await fetchWords()
      console.log('Fetch result:', result)
      
      if (result.success && result.words.length > 0) {
        console.log('Setting up game with words:', result.words.length)
        // Set words state first, then start the game
        setWords(result.words)
        setSessionStartTime(Date.now())
        setWordsPerMinute(0)
        
        // Force the game to start by directly setting the first word
        const firstWord = result.words[0]
        setCurrentWord(firstWord)
        setGameState('showing')
        
        // Get the word details to find FSRS stability
        const firstWordDetail = result.details.find(detail => detail.hebrew === firstWord)
        const stability = firstWordDetail?.fsrs_stability || 0.1
        
        // Calculate adaptive display time based on FSRS stability
        const displayTime = calculateDisplayTime(stability)
        
        console.log(`Showing first word "${firstWord}" for ${displayTime}ms (stability: ${stability})`)
        
        // Hide word after adaptive time
        setTimeout(() => {
          setGameState('input')
        }, displayTime)
      } else {
        console.log('Failed to load words, going back to menu')
        // If fetch fails, go back to menu
        onBackToMenu()
      }
    }
    
    initializeGame()
  }, []) // Keep empty dependency array

  // Show current word
  const showWord = (wordsToUse = words, indexToUse = currentWordIndex) => {
    if (indexToUse < wordsToUse.length && wordsToUse.length > 0) {
      const currentWord = wordsToUse[indexToUse]
      setCurrentWord(currentWord)
      setGameState('showing')
      
      // Get the word details to find FSRS stability
      const currentWordDetail = wordDetails.find(detail => detail.hebrew === currentWord)
      const stability = currentWordDetail?.fsrs_stability || 0.1
      
      // Calculate adaptive display time based on FSRS stability
      const displayTime = calculateDisplayTime(stability)
      
      console.log(`Showing word "${currentWord}" for ${displayTime}ms (stability: ${stability})`)
      
      // Hide word after adaptive time
      setTimeout(() => {
        setGameState('input')
      }, displayTime)
    } else if (wordsToUse.length === 0) {
      // If no words loaded, stay in loading state
      setGameState('loading')
    } else {
      endGame()
    }
  }

  // Handle user input submission
  const handleSubmit = (input) => {
    setUserInput(input)
    const correct = normalizeHebrew(input) === normalizeHebrew(currentWord)
    setIsCorrect(correct)
    
    // Store the word that was being tested
    setLastTestedWord(currentWord)
    // Store the word details for the review
    const currentWordDetail = wordDetails.find(detail => detail.hebrew === currentWord)
    setLastTestedWordDetails(currentWordDetail)
    
    // Track result for FSRS progress
    setGameResults(prev => [...prev, { hebrew: currentWord, correct }])
    
    // Save FSRS progress immediately after each word
    saveFSRSProgress(currentWord, correct)
    
    if (correct) {
      setScore(score + 10)
      setWordsCorrect(wordsCorrect + 1)
    }

    // Show flash animation
    setGameState('flash')
    
    // Flash duration and then continue immediately
    setTimeout(() => {
      const nextIndex = currentWordIndex + 1
      setCurrentWordIndex(nextIndex)
      if (nextIndex < words.length) {
        setIsCorrect(null)
        setShowReviewButton(!correct) // Show review button only for incorrect answers
        showWord(words, nextIndex) // Use the incremented index explicitly
      } else {
        endGame()
      }
    }, correct ? 600 : 800) // Shorter flash for correct, slightly longer for incorrect
  }

  // Show review of the last answer
  const showReview = () => {
    setGameState('review')
  }

  // Continue to next word from review
  const continueFromReview = () => {
    setIsCorrect(null)
    setShowReviewButton(false)
    showWord() // Use current words state
  }

  // End game and submit score
  const endGame = async () => {
    setGameState('gameOver')
    
    const sessionDuration = Date.now() - sessionStartTime
    const minutes = sessionDuration / 60000 // Convert to minutes
    const wpm = minutes > 0 ? Math.round(wordsCorrect / minutes) : 0
    setWordsPerMinute(wpm)
    
    try {
      // Submit score
      await axios.post(getApiUrl('/scores'), {
        score,
        wordsAttempted: currentWordIndex + 1,
        wordsCorrect,
        sessionDuration,
        wordsPerMinute: wpm
      })
      
      // FSRS progress is now saved after each word submission, so no need to save here
    } catch (error) {
      console.error('Error submitting score or progress:', error)
    }
  }

  // Play again
  const playAgain = () => {
    // Reset all state
    setCurrentWordIndex(0)
    setCurrentWord('')
    setUserInput('')
    setScore(0)
    setWordsCorrect(0)
    setIsCorrect(null)
    setShowReviewButton(false)
    setLastTestedWord('')
    setLastTestedWordDetails(null)
    setGameResults([]) // Reset game results
    setGameState('loading')
    hasInitialized.current = false // Reset initialization flag
    
    // Re-initialize the game
    const reinitializeGame = async () => {
      const result = await fetchWords()
      if (result.success && result.words.length > 0) {
        setSessionStartTime(Date.now())
        setWordsPerMinute(0)
        showWord(result.words) // Pass words directly
      } else {
        onBackToMenu()
      }
    }
    
    reinitializeGame()
  }

  // Render different game states
  const renderGameContent = () => {
    switch (gameState) {
      case 'loading':
        return <Loading />

      case 'showing':
        return (
          <div className="showing-container">
            <WordDisplay 
              word={currentWord} 
              instruction="Memorize this word!"
              displayTime={calculateDisplayTime(wordDetails.find(detail => detail.hebrew === currentWord)?.fsrs_stability || 0.1)}
            />
            {showReviewButton && currentWordIndex > 0 && (
              <button className="review-button" onClick={showReview}>
                Review Last Answer
              </button>
            )}
          </div>
        )

      case 'input':
        return (
          <div className="input-container">
            <InputForm onSubmit={handleSubmit} />
            {showReviewButton && (
              <button className="review-button" onClick={showReview}>
                Review Last Answer
              </button>
            )}
          </div>
        )

      case 'flash':
        return (
          <div className="flash-container">
            <div className={`flash-icon ${isCorrect ? 'correct-icon' : 'incorrect-icon'}`}>
              {isCorrect ? '✓' : '✗'}
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="review-container">
            <ReviewWord 
              isCorrect={isCorrect}
              correctWord={lastTestedWord}
              userInput={userInput}
              english={lastTestedWordDetails?.english || ''}
              transliteration={lastTestedWordDetails?.transliteration || ''}
            />
          </div>
        )

      case 'gameOver':
        return (
          <GameOver 
            score={score}
            wordsCorrect={wordsCorrect}
            totalWords={words.length}
            wordsPerMinute={wordsPerMinute}
            onPlayAgain={playAgain}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`game-container ${gameState === 'flash' ? (isCorrect ? 'flash-correct' : 'flash-incorrect') : ''} ${gameState === 'review' ? 'review-mode' : ''}`}>
      {gameState !== 'gameOver' && gameState !== 'review' && (
        <GameHeader 
          score={score}
          currentWordIndex={currentWordIndex}
          totalWords={words.length}
          onBackToMenu={onBackToMenu}
          isCorrect={isCorrect}
        />
      )}
      {gameState === 'review' && (
        <div className="review-header">
          <button className="back-button" onClick={continueFromReview} title="Back to Game">
            ←
          </button>
          <div className="review-title">Review Answer</div>
        </div>
      )}
      {renderGameContent()}
    </div>
  )
}

export default GamePage
