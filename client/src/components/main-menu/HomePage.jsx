import { useEffect, useState } from 'react'
import { UserBar } from './index'
import { LoginPage, SignupPage } from '../auth'
import { VocabReviewPage } from '../vocab'
import DeckCarousel from '../shared/DeckCarousel'
import {
  GameSelection,
  ReviewVocabSection,
  StartGameSection,
  CreateDeckSection
} from './components'
import './HomePage.css'
import axios from 'axios'
import { getApiUrl } from '../../config'

function HomePage({ onStartGame }) {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', 'signup', 'review'
  const [user, setUser] = useState(null)
  const [selectedGame, setSelectedGame] = useState('speed-test')



  // Ensure user has at least 20 learning words when on home page
  useEffect(() => {
    const ensureLearning = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await axios.post(getApiUrl('/progress/ensure'), { min: 20 })
      } catch (e) {
        console.error('ensure learning failed', e)
      }
    }
    
    // Only run when on home page and user is logged in
    if (currentPage === 'home' && user) {
      ensureLearning()
    }
  }, [currentPage, user])

  const handleNavigateToLogin = () => {
    setCurrentPage('login')
  }

  const handleNavigateToSignup = () => {
    setCurrentPage('signup')
  }

  const handleNavigateToReview = () => {
    setCurrentPage('review')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setCurrentPage('home')
  }

  const handleSignupSuccess = (userData) => {
    setUser(userData)
    setCurrentPage('home')
  }

  const handleStartGame = () => {
    if (!user) {
      // Show login prompt instead of starting game
      setCurrentPage('login')
      return
    }
    // TODO: Pass selected game type and deck to game when implemented
    onStartGame()
  }

  const handleGameSelect = (gameType) => {
    setSelectedGame(gameType)
  }

  const handleDeckSelect = (deck) => {
    console.log('Selected deck:', deck)
    // TODO: Store selected deck for game initialization
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage 
            onBackToHome={handleBackToHome}
            onLoginSuccess={handleLoginSuccess}
          />
        )
      case 'signup':
        return (
          <SignupPage 
            onBackToHome={handleBackToHome}
            onSignupSuccess={handleSignupSuccess}
          />
        )
      case 'review':
        return (
          <VocabReviewPage 
            onBackToHome={handleBackToHome}
          />
        )
      default:
  return (
    <div className="home-page">
      {/* Header */}
      <header className="page-header">
        <h1 className="app-title">Spellbrew</h1>
        <UserBar
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToSignup={handleNavigateToSignup}
          onUserChange={setUser}
        />
      </header>

      <div className="page-content">
        {/* Deck Selection Section */}
        <section className="deck-selection-section">
          <DeckCarousel onDeckChange={handleDeckSelect} />
        </section>

        {/* Review Vocabulary Section */}
        <ReviewVocabSection onNavigateToReview={handleNavigateToReview} />

        {/* Create New Deck Section */}
        <CreateDeckSection />

        {/* Game Selection Section */}
        <GameSelection
          selectedGame={selectedGame}
          onGameSelect={handleGameSelect}
        />

        {/* Start Game Section */}
        <StartGameSection
          onStartGame={handleStartGame}
          user={user}
        />
      </div>
    </div>
  )
    }
  }

  return renderContent()
}

export default HomePage
