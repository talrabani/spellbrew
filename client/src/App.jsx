import { useState } from 'react'
import { HomePage, GamePage } from './components'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home' or 'game'

  const startGame = () => {
    setCurrentPage('game')
  }

  const backToMenu = () => {
    setCurrentPage('home')
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onStartGame={startGame} />
      case 'game':
        return <GamePage onBackToMenu={backToMenu} />
      default:
        return <HomePage onStartGame={startGame} />
    }
  }

  return (
    <div className="App">
      {renderContent()}
    </div>
  )
}

export default App