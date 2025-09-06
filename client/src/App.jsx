import { useState, useEffect } from 'react'
import { HomePage, GamePage } from './components'
import InitialPage from './components/initial-page/InitialPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('initial') // 'initial', 'home', or 'game'
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          // User is logged in, go directly to home page
          setCurrentPage('home')
          // You could also fetch user data here if needed
        } else {
          // User is not logged in, show initial page
          setCurrentPage('initial')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setCurrentPage('initial')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const startGame = () => {
    setCurrentPage('game')
  }

  const backToMenu = () => {
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
    if (isLoading) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )
    }

    switch (currentPage) {
      case 'initial':
        return (
          <InitialPage
            onLoginSuccess={handleLoginSuccess}
            onSignupSuccess={handleSignupSuccess}
          />
        )
      case 'home':
        return <HomePage onStartGame={startGame} />
      case 'game':
        return <GamePage onBackToMenu={backToMenu} />
      default:
        return (
          <InitialPage
            onLoginSuccess={handleLoginSuccess}
            onSignupSuccess={handleSignupSuccess}
          />
        )
    }
  }

  return (
    <div className="App">
      {renderContent()}
    </div>
  )
}

export default App