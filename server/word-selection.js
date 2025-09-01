/**
 * Simple Word Selection Algorithm for Spellbrew
 * 
 * This algorithm selects words based on:
 * 1. Time since last seen (longer = higher priority)
 * 2. Word difficulty (more errors = higher priority)
 * 3. Word stages (new words get unlimited time, known words appear briefly)
 */

// Word stages and their display durations (in milliseconds)
const WORD_STAGES = {
  NEW: {
    name: 'new',
    displayTime: null, // Unlimited time
    minSeenCount: 0,
    maxSeenCount: 2
  },
  LEARNING: {
    name: 'learning',
    displayTime: 5000, // 5 seconds
    minSeenCount: 3,
    maxSeenCount: 9
  },
  PRACTICING: {
    name: 'practicing',
    displayTime: 3000, // 3 seconds
    minSeenCount: 10,
    maxSeenCount: 24
  },
  KNOWN: {
    name: 'known',
    displayTime: 1500, // 1.5 seconds
    minSeenCount: 25,
    maxSeenCount: null
  }
};

// Difficulty thresholds
const DIFFICULTY_THRESHOLDS = {
  EASY: 0.2,    // Error rate < 20%
  MEDIUM: 0.4,  // Error rate 20-40%
  HARD: 0.6,    // Error rate 40-60%
  VERY_HARD: 0.8 // Error rate > 60%
};

/**
 * Calculate word difficulty based on error rate
 * @param {number} timesWrong - Number of times user got it wrong
 * @param {number} timesSeen - Number of times user has seen the word
 * @returns {number} Difficulty score (0-100)
 */
function calculateWordDifficulty(timesWrong, timesSeen) {
  if (timesSeen === 0) return 50; // Default difficulty for new words
  
  const errorRate = timesWrong / timesSeen;
  
  // Convert error rate to difficulty score (0-100)
  // Higher error rate = higher difficulty
  return Math.min(100, Math.max(0, errorRate * 100));
}

/**
 * Calculate time priority based on days since last seen
 * @param {Date} lastSeen - When the word was last seen
 * @returns {number} Time priority score (0-100)
 */
function calculateTimePriority(lastSeen) {
  if (!lastSeen) return 100; // Never seen = highest priority
  
  const now = new Date();
  const daysSinceLastSeen = (now - new Date(lastSeen)) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: longer time = higher priority
  // Cap at 30 days for maximum priority
  const maxDays = 30;
  const normalizedDays = Math.min(daysSinceLastSeen, maxDays) / maxDays;
  
  return normalizedDays * 100;
}

/**
 * Get word stage based on times seen
 * @param {number} timesSeen - Number of times user has seen the word
 * @returns {Object} Word stage object
 */
function getWordStage(timesSeen) {
  for (const [key, stage] of Object.entries(WORD_STAGES)) {
    if (timesSeen >= stage.minSeenCount && 
        (stage.maxSeenCount === null || timesSeen <= stage.maxSeenCount)) {
      return stage;
    }
  }
  
  // Fallback to known stage
  return WORD_STAGES.KNOWN;
}

/**
 * Calculate overall priority score for word selection
 * @param {Object} word - Word object with progress data
 * @returns {Object} Priority calculation result
 */
function calculateWordPriority(word) {
  const timesSeen = word.times_seen || 0;
  const timesWrong = word.times_wrong || 0;
  const lastSeen = word.last_seen;
  
  // Calculate individual factors
  const difficulty = calculateWordDifficulty(timesWrong, timesSeen);
  const timePriority = calculateTimePriority(lastSeen);
  const wordStage = getWordStage(timesSeen);
  
  // Weight the factors
  const difficultyWeight = 0.4;  // 40% weight
  const timeWeight = 0.4;        // 40% weight
  const stageWeight = 0.2;       // 20% weight
  
  // Stage bonus: new words get priority boost
  const stageBonus = wordStage.name === 'new' ? 20 : 0;
  
  // Calculate weighted priority score
  const priorityScore = 
    (difficulty * difficultyWeight) +
    (timePriority * timeWeight) +
    (stageBonus * stageWeight);
  
  return {
    priorityScore: Math.round(priorityScore),
    difficulty,
    timePriority: Math.round(timePriority),
    wordStage: wordStage.name,
    displayTime: wordStage.displayTime,
    factors: {
      difficulty,
      timePriority: Math.round(timePriority),
      stageBonus,
      timesSeen,
      timesWrong,
      errorRate: timesSeen > 0 ? (timesWrong / timesSeen) : 0
    }
  };
}

/**
 * Select words for a game session
 * @param {Array} userWords - Array of user's vocabulary words with progress
 * @param {number} count - Number of words to select
 * @param {Object} options - Selection options
 * @returns {Array} Selected words with priority information
 */
function selectWordsForGame(userWords, count = 20, options = {}) {
  const {
    includeNewWords = true,
    newWordRatio = 0.3, // 30% new words
    minDifficulty = 0,
    maxDifficulty = 100
  } = options;
  
  // Separate new words from existing words
  const newWords = userWords.filter(word => (word.times_seen || 0) === 0);
  const existingWords = userWords.filter(word => (word.times_seen || 0) > 0);
  
  // Special case: if all words are new (first-time user), use all available words
  if (newWords.length > 0 && existingWords.length === 0) {
    const selectedNewWords = newWords
      .slice(0, count) // Take up to the requested count
      .map(word => ({
        ...word,
        priority: calculateWordPriority(word)
      }));
    
    return shuffleArray(selectedNewWords);
  }
  
  // Calculate priorities for existing words
  const prioritizedWords = existingWords.map(word => ({
    ...word,
    priority: calculateWordPriority(word)
  }));
  
  // Sort by priority score (highest first)
  prioritizedWords.sort((a, b) => b.priority.priorityScore - a.priority.priorityScore);
  
  // Filter by difficulty if specified
  const filteredWords = prioritizedWords.filter(word => 
    word.priority.difficulty >= minDifficulty && 
    word.priority.difficulty <= maxDifficulty
  );
  
  let selectedWords = [];
  
  if (includeNewWords && newWords.length > 0) {
    // Add new words
    const newWordCount = Math.min(
      Math.floor(count * newWordRatio),
      newWords.length
    );
    
    const selectedNewWords = newWords
      .slice(0, newWordCount)
      .map(word => ({
        ...word,
        priority: calculateWordPriority(word)
      }));
    
    selectedWords.push(...selectedNewWords);
  }
  
  // Add existing words to fill remaining slots
  const remainingSlots = count - selectedWords.length;
  const selectedExistingWords = filteredWords.slice(0, remainingSlots);
  selectedWords.push(...selectedExistingWords);
  
  // Shuffle the final selection for variety
  return shuffleArray(selectedWords);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Update word progress after a game session
 * @param {Object} word - Word object
 * @param {boolean} correct - Whether user answered correctly
 * @returns {Object} Updated word data
 */
function updateWordProgress(word, correct) {
  const timesSeen = (word.times_seen || 0) + 1;
  const timesWrong = (word.times_wrong || 0) + (correct ? 0 : 1);
  const lastSeen = new Date();
  
  return {
    times_seen: timesSeen,
    times_wrong: timesWrong,
    last_seen: lastSeen,
    word_stage: getWordStage(timesSeen).name,
    display_time: getWordStage(timesSeen).displayTime
  };
}

/**
 * Get learning statistics for a user
 * @param {Array} userWords - Array of user's vocabulary words
 * @returns {Object} Learning statistics
 */
function getLearningStats(userWords) {
  const stats = {
    total: userWords.length,
    new: 0,
    learning: 0,
    practicing: 0,
    known: 0,
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
      veryHard: 0
    }
  };
  
  userWords.forEach(word => {
    const timesSeen = word.times_seen || 0;
    const timesWrong = word.times_wrong || 0;
    const wordStage = getWordStage(timesSeen);
    const difficulty = calculateWordDifficulty(timesWrong, timesSeen);
    
    // Count by stage
    stats[wordStage.name]++;
    
    // Count by difficulty
    if (difficulty < DIFFICULTY_THRESHOLDS.EASY * 100) {
      stats.byDifficulty.easy++;
    } else if (difficulty < DIFFICULTY_THRESHOLDS.MEDIUM * 100) {
      stats.byDifficulty.medium++;
    } else if (difficulty < DIFFICULTY_THRESHOLDS.HARD * 100) {
      stats.byDifficulty.hard++;
    } else {
      stats.byDifficulty.veryHard++;
    }
  });
  
  return stats;
}

module.exports = {
  calculateWordDifficulty,
  calculateTimePriority,
  getWordStage,
  calculateWordPriority,
  selectWordsForGame,
  updateWordProgress,
  getLearningStats,
  WORD_STAGES,
  DIFFICULTY_THRESHOLDS
};
