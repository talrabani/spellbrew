import { useState } from 'react'
import UserBar from './UserBar'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import './HomePage.css'

function HomePage({ onStartGame }) {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', 'signup'
  const [user, setUser] = useState(null)

  const handleNavigateToLogin = () => {
    setCurrentPage('login')
  }

  const handleNavigateToSignup = () => {
    setCurrentPage('signup')
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
      default:
        return (
          <div className="home-page">
            <div className="home-container">      
              <UserBar 
                onNavigateToLogin={handleNavigateToLogin}
                onNavigateToSignup={handleNavigateToSignup}
              />
              <div className="main-menu">
                <h1 className="game-title">Spellbrew</h1>
                <p className="game-subtitle">Hebrew Speed Spelling Challenge</p>
                <p className="game-description">Test how many Hebrew words you can spell per minute!</p>
                <button className="play-button" onClick={onStartGame}>
                  Start Speed Test
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return renderContent()
}

export default HomePage
