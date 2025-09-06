import './ReviewVocabSection.css'

function ReviewVocabSection({ onNavigateToReview }) {
  return (
    <section className="review-vocab-section">
      <button className="review-vocab-button" onClick={onNavigateToReview}>
        <span className="review-icon">📚</span>
        <span className="review-text">Review Vocabulary</span>
      </button>
    </section>
  )
}

export default ReviewVocabSection
