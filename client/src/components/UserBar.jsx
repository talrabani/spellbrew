import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../config'
import './UserBar.css'

function UserBar({ onNavigateToLogin, onNavigateToSignup }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (token) {
        // Set default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Fetch user data from API
        const response = await axios.get(getApiUrl('/user/profile'))
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      // Clear invalid token
      localStorage.removeItem('authToken')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    onNavigateToLogin()
  }

  const handleSignup = () => {
    onNavigateToSignup()
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  if (isLoading) {
    return <div className="user-bar loading">Loading...</div>
  }

  return (
    <div className="user-bar">
      {user ? (
        // Logged in user view - Player bar
        <div className="player-bar">
          <div className="profile-picture-placeholder">
            {/* Empty profile picture placeholder */}
          </div>
          <div className="player-info">
            <div className="player-name">{user.displayName || 'Player'}</div>
          </div>
          <div className="player-level">
            <div className="star-icon">★</div>
            <div className="level-text">Level {user.level}</div>
          </div>
          <button className="logout-button" onClick={handleLogout} title="Logout">
            <span>×</span>
          </button>
        </div>
      ) : (
        // Not logged in view
        <div className="auth-buttons">
          <button className="login-button" onClick={handleLogin}>
            Log In
          </button>
          <button className="signup-button" onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      )}
    </div>
  )
}

export default UserBar
