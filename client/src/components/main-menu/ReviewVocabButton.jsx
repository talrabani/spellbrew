import './ReviewVocabButton.css'

function ReviewVocabButton({ onNavigateToReview }) {
  return (
    <div className="review-vocab-container">
      <button className="review-vocab-button" onClick={onNavigateToReview}>
        <span className="review-icon">📚</span>
        <span className="review-text">Review Vocabulary</span>
      </button>
    </div>
  )
}

export default ReviewVocabButton
