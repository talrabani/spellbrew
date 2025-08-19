import { useEffect, useState } from 'react'
import { UserBar, ReviewVocabButton } from './index'
import { LoginPage, SignupPage } from '../auth'
import { VocabReviewPage } from '../vocab'
import './HomePage.css'
import axios from 'axios'
import { getApiUrl } from '../../config'

function HomePage({ onStartGame }) {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', 'signup', 'review'
  const [user, setUser] = useState(null)



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
    onStartGame()
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
            <div className="home-container">      
              <UserBar 
                onNavigateToLogin={handleNavigateToLogin}
                onNavigateToSignup={handleNavigateToSignup}
                onUserChange={setUser}
              />
              <div className="main-menu">
                <h1 className="game-title">Spellbrew</h1>
                <p className="game-subtitle">Hebrew Speed Spelling Challenge</p>
                <p className="game-description">Test how many Hebrew words you can spell per minute!</p>
                <button className="play-button" onClick={handleStartGame}>
                  {user ? 'Start Speed Test' : 'Please log in or make an account to play'}
                </button>
              </div>
              <ReviewVocabButton onNavigateToReview={handleNavigateToReview} />
            </div>
          </div>
        )
    }
  }

  return renderContent()
}

export default HomePage
