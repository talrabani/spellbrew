import { useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../config'
import './LoginPage.css'

function LoginPage({ onBackToHome, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(getApiUrl('/auth/login'), formData)
      
      // Store token in localStorage
      localStorage.setItem('authToken', response.data.token)
      
      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      
      // Call success callback
      onLoginSuccess(response.data.user)
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="page-title">Welcome Back</h1>
        <p className="page-subtitle">Sign in to continue your Hebrew learning journey</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username or email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="form-footer">
          <p>Don't have an account?</p>
          <button className="link-button" onClick={onBackToHome}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
