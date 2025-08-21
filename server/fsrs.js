/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Based on scientific memory research and optimized spaced repetition algorithms
 */

// FSRS weights (optimized through machine learning)
const FSRS_WEIGHTS = {
  w1: 1.0,   // Initial stability
  w2: 5.0,   // Stability increase for successful reviews
  w3: -0.5,  // Stability decrease for failed reviews
  w4: 0.1,   // Difficulty adjustment
  w5: 1.0,   // Retrievability factor
  w6: 0.1    // Time factor
};

// Target retrievability (90% success rate)
const TARGET_RETRIEVABILITY = 0.9;

/**
 * Calculate the next interval in days based on stability and desired retrievability
 * @param {number} stability - Current stability value
 * @param {number} desiredRetrievability - Target success rate (default 0.9)
 * @returns {number} Interval in days
 */
function calculateNextInterval(stability, desiredRetrievability = TARGET_RETRIEVABILITY) {
  if (stability <= 0) return 1;
  return Math.max(1, Math.round(stability * Math.log(desiredRetrievability) / Math.log(0.9)));
}

/**
 * Calculate current retrievability based on time since last review
 * @param {number} stability - Current stability value
 * @param {number} timeSinceLastReview - Time in days since last review
 * @returns {number} Retrievability (0-1 scale)
 */
function calculateRetrievability(stability, timeSinceLastReview) {
  if (stability <= 0 || timeSinceLastReview <= 0) return 0;
  return Math.pow(0.9, timeSinceLastReview / stability);
}

/**
 * Map game result (correct/incorrect) to FSRS rating based on current retrievability
 * @param {boolean} isCorrect - Whether the user answered correctly
 * @param {number} currentRetrievability - Current retrievability value
 * @returns {number} FSRS rating (1=again, 2=hard, 3=good, 4=easy)
 */
function gameResultToRating(isCorrect, currentRetrievability) {
  if (!isCorrect) {
    return 1; // again
  }
  
  // If user got it right when retrievability was low, it's "easy"
  if (currentRetrievability < 0.6) return 4; // easy
  if (currentRetrievability < 0.8) return 3; // good
  return 2; // hard
}

/**
 * Update FSRS parameters based on review result
 * @param {number} stability - Current stability
 * @param {number} difficulty - Current difficulty
 * @param {number} retrievability - Current retrievability
 * @param {number} rating - FSRS rating (1-4)
 * @returns {Object} Updated stability and difficulty
 */
function updateFSRSParameters(stability, difficulty, retrievability, rating) {
  // Simplified FSRS update algorithm
  // In a full implementation, this would use more complex mathematical formulas
  
  let newStability = stability;
  let newDifficulty = difficulty;
  
  switch (rating) {
    case 1: // again
      newStability = Math.max(0.1, stability * 0.8);
      newDifficulty = Math.min(10, difficulty + 0.2);
      break;
    case 2: // hard
      newStability = Math.max(0.1, stability * 0.9);
      newDifficulty = Math.min(10, difficulty + 0.1);
      break;
    case 3: // good
      newStability = stability * 1.1;
      newDifficulty = Math.max(1, difficulty - 0.05);
      break;
    case 4: // easy
      newStability = stability * 1.3;
      newDifficulty = Math.max(1, difficulty - 0.1);
      break;
  }
  
  // Cap stability at reasonable bounds
  newStability = Math.min(100, Math.max(0.1, newStability));
  newDifficulty = Math.min(10, Math.max(1, newDifficulty));
  
  return { newStability, newDifficulty };
}

/**
 * Calculate learning progress percentage based on FSRS parameters
 * @param {number} stability - Current stability
 * @param {number} difficulty - Current difficulty
 * @param {number} reviewCount - Number of reviews
 * @returns {number} Progress percentage (0-100)
 */
function calculateProgressPercentage(stability, difficulty, reviewCount) {
  // Progress is based on stability and review count
  // Higher stability and more reviews indicate better learning
  const stabilityFactor = Math.min(1, stability / 10); // Normalize stability to 0-1
  const reviewFactor = Math.min(1, reviewCount / 10); // Normalize review count to 0-1
  const difficultyFactor = Math.max(0, (10 - difficulty) / 9); // Lower difficulty = higher progress
  
  // Weighted combination
  const progress = (stabilityFactor * 0.5 + reviewFactor * 0.3 + difficultyFactor * 0.2) * 100;
  return Math.round(Math.min(100, Math.max(0, progress)));
}

/**
 * Get learning status based on FSRS parameters
 * @param {number} stability - Current stability
 * @param {number} reviewCount - Number of reviews
 * @returns {string} Learning status
 */
function getLearningStatus(stability, reviewCount) {
  if (reviewCount === 0) return 'new';
  if (stability < 1) return 'learning';
  if (stability < 5) return 'reviewing';
  return 'mastered';
}

/**
 * Calculate days until next review
 * @param {Date} nextReview - Next review date
 * @returns {number} Days until next review
 */
function getDaysUntilNextReview(nextReview) {
  if (!nextReview) return 0;
  const now = new Date();
  const diffTime = nextReview - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  calculateNextInterval,
  calculateRetrievability,
  gameResultToRating,
  updateFSRSParameters,
  calculateProgressPercentage,
  getLearningStatus,
  getDaysUntilNextReview,
  TARGET_RETRIEVABILITY
};
