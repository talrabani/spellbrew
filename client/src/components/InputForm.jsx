import { useState } from 'react'
import './InputForm.css'

function InputForm({ onSubmit }) {
  const [userInput, setUserInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (userInput.trim() === '') return
    onSubmit(userInput)
    setUserInput('')
  }

  return (
    <div className="input-container">
      <div className="instruction">Type the word you saw:</div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="word-input"
          placeholder="Type here..."
          autoFocus
          dir="rtl"
        />
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  )
}

export default InputForm
