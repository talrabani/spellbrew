import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../config'
import { GameHeader, Loading, WordDisplay, InputForm, ResultDisplay, GameOver } from './index'
import './GamePage.css'

function GamePage({ onBackToMenu }) {
  // Game states: 'loading', 'showing', 'input', 'flash', 'review', 'gameOver'
  const [gameState, setGameState] = useState('loading')
  const [words, setWords] = useState([])
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
  const hasInitialized = useRef(false)

  // Normalize Hebrew text for comparison
  const normalizeHebrew = (text) => {
    return text.trim().replace(/\s+/g, ' ')
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
      
      // Fetch words from user's vocabulary
      const response = await axios.get(getApiUrl('/words/user?count=20'))
      const fetchedWords = response.data.words
      setWords(fetchedWords)
      console.log('Fetched user words:', fetchedWords)
      return { success: true, words: fetchedWords }
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
      
      const result = await fetchWords()
      console.log('Fetch result:', result)
      
      if (result.success && result.words.length > 0) {
        console.log('Setting up game with words:', result.words.length)
        // Set words state first, then start the game
        setWords(result.words)
        setSessionStartTime(Date.now())
        setWordsPerMinute(0)
        
        // Force the game to start by directly setting the first word
        setCurrentWord(result.words[0])
        setGameState('showing')
        
        // Hide word after 1.5 seconds
        setTimeout(() => {
          setGameState('input')
        }, 1500)
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
      setCurrentWord(wordsToUse[indexToUse])
      setGameState('showing')
      
      // Hide word after 1.5 seconds (faster for speed test)
      setTimeout(() => {
        setGameState('input')
      }, 1500)
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
      await axios.post(getApiUrl('/scores'), {
        score,
        wordsAttempted: currentWordIndex + 1,
        wordsCorrect,
        sessionDuration,
        wordsPerMinute: wpm
      })
    } catch (error) {
      console.error('Error submitting score:', error)
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
          <WordDisplay 
            word={currentWord} 
            instruction="Memorize this word!" 
          />
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
            <ResultDisplay 
              isCorrect={isCorrect}
              correctWord={lastTestedWord}
              userInput={userInput}
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
