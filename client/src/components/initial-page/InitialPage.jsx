import { useState } from 'react'
import WelcomeSection from './WelcomeSection'
import { LoginPage, SignupPage } from '../auth'
import './InitialPage.css'

function InitialPage({ onLoginSuccess, onSignupSuccess }) {
  const [currentView, setCurrentView] = useState('welcome') // 'welcome', 'login', 'signup'

  const handleNavigateToLogin = () => {
    setCurrentView('login')
  }

  const handleNavigateToSignup = () => {
    setCurrentView('signup')
  }

  const handleBackToWelcome = () => {
    setCurrentView('welcome')
  }

  const handleLoginSuccess = (userData) => {
    onLoginSuccess(userData)
  }

  const handleSignupSuccess = (userData) => {
    onSignupSuccess(userData)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            onBackToHome={handleBackToWelcome}
            onLoginSuccess={handleLoginSuccess}
          />
        )
      case 'signup':
        return (
          <SignupPage
            onBackToHome={handleBackToWelcome}
            onSignupSuccess={handleSignupSuccess}
          />
        )
      default:
        return (
          <div className="initial-page">
            <WelcomeSection />
            <div className="auth-prompt-section">
              <h2 className="auth-prompt-title">Ready to Start Your Learning Journey?</h2>
              <p className="auth-prompt-description">
                Join thousands of learners mastering Hebrew through interactive spelling challenges!
              </p>
              <div className="auth-buttons">
                <button className="auth-button primary" onClick={handleNavigateToSignup}>
                  Create Account
                </button>
                <button className="auth-button secondary" onClick={handleNavigateToLogin}>
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return renderContent()
}

export default InitialPage
