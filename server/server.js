const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db/db');
const fsrs = require('./fsrs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure CORS to allow connections from other devices
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', /^http:\/\/192\.168\.\d+\.\d+:5173$/],
  credentials: true
}));
app.use(express.json());

// Helper: get or create a user_vocabulary_progress row with FSRS parameters
async function upsertUserVocabProgress({ 
  userId, 
  vocabId, 
  fsrsStability = null,
  fsrsDifficulty = null,
  fsrsRetrievability = null,
  fsrsLastReview = null,
  fsrsNextReview = null,
  reviewCountDelta = 0,
  seenDelta = 0, 
  wrongDelta = 0 
}) {
  const now = new Date();
  
  // Try update existing, otherwise insert
  const updated = await pool.query(
    `UPDATE user_vocabulary_progress
     SET fsrs_stability = COALESCE($1, fsrs_stability),
         fsrs_difficulty = COALESCE($2, fsrs_difficulty),
         fsrs_retrievability = COALESCE($3, fsrs_retrievability),
         fsrs_last_review = COALESCE($4, fsrs_last_review),
         fsrs_next_review = COALESCE($5, fsrs_next_review),
         fsrs_review_count = fsrs_review_count + $6,
         times_seen = times_seen + $7,
         times_wrong = times_wrong + $8,
         last_seen = CURRENT_TIMESTAMP
     WHERE user_id = $9 AND vocabulary_id = $10
     RETURNING id`,
    [fsrsStability, fsrsDifficulty, fsrsRetrievability, fsrsLastReview, fsrsNextReview, 
     reviewCountDelta, seenDelta, wrongDelta, userId, vocabId]
  );
  
  if (updated.rowCount > 0) return updated.rows[0];
  
  const inserted = await pool.query(
    `INSERT INTO user_vocabulary_progress (
       user_id, vocabulary_id, fsrs_stability, fsrs_difficulty, fsrs_retrievability,
       fsrs_last_review, fsrs_next_review, fsrs_review_count, times_seen, times_wrong,
       first_seen, last_seen
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, vocabulary_id) DO UPDATE SET
       fsrs_stability = COALESCE(EXCLUDED.fsrs_stability, user_vocabulary_progress.fsrs_stability),
       fsrs_difficulty = COALESCE(EXCLUDED.fsrs_difficulty, user_vocabulary_progress.fsrs_difficulty),
       fsrs_retrievability = COALESCE(EXCLUDED.fsrs_retrievability, user_vocabulary_progress.fsrs_retrievability),
       fsrs_last_review = COALESCE(EXCLUDED.fsrs_last_review, user_vocabulary_progress.fsrs_last_review),
       fsrs_next_review = COALESCE(EXCLUDED.fsrs_next_review, user_vocabulary_progress.fsrs_next_review),
       fsrs_review_count = user_vocabulary_progress.fsrs_review_count + EXCLUDED.fsrs_review_count,
       times_seen = user_vocabulary_progress.times_seen + EXCLUDED.times_seen,
       times_wrong = user_vocabulary_progress.times_wrong + EXCLUDED.times_wrong,
       last_seen = CURRENT_TIMESTAMP
     RETURNING id`,
    [userId, vocabId, fsrsStability || 0.1, fsrsDifficulty || 5.0, fsrsRetrievability || 0.0,
     fsrsLastReview || now, fsrsNextReview || now, reviewCountDelta, seenDelta, wrongDelta]
  );
  return inserted.rows[0];
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, username, display_name, email, profile_picture_url, level, experience_points FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// User registration
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, email, level, experience_points',
      [username, email, hashedPassword, displayName || username]
    );
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        level: user.level,
        experiencePoints: user.experience_points
      },
      token
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT id, username, display_name, email, password_hash, profile_picture_url, level, experience_points FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        profilePictureUrl: user.profile_picture_url,
        level: user.level,
        experiencePoints: user.experience_points
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.display_name,
        email: req.user.email,
        profilePictureUrl: req.user.profile_picture_url,
        level: req.user.level,
        experiencePoints: req.user.experience_points
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get batch of random words from database (for non-authenticated users)
app.get('/api/words', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    
    // Get random words from database
    const result = await pool.query(
      'SELECT hebrew, english, transliteration FROM vocabulary ORDER BY RANDOM() LIMIT $1',
      [count]
    );
    
    const words = result.rows.map(row => row.hebrew);
    
    res.json({ 
      words: words,
      totalAvailable: result.rows.length,
      details: result.rows // Include English and transliteration for debugging
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Get batch of words from user's vocabulary using FSRS algorithm (authenticated users only)
app.get('/api/words/user', authenticateToken, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const now = new Date();
    
    // First, check if user has any words in their vocabulary progress
    const userWordCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_vocabulary_progress WHERE user_id = $1',
      [req.user.id]
    );
    
    let result;
    if (userWordCount.rows[0].count > 0) {
      // User has words in progress - get words due for review
      result = await pool.query(
        `SELECT 
           v.id, v.hebrew, v.english, v.transliteration,
           COALESCE(uvp.fsrs_stability, 0.1) as fsrs_stability,
           COALESCE(uvp.fsrs_difficulty, 5.0) as fsrs_difficulty,
           COALESCE(uvp.fsrs_retrievability, 0.0) as fsrs_retrievability,
           uvp.fsrs_next_review,
           COALESCE(uvp.fsrs_review_count, 0) as fsrs_review_count,
           COALESCE(uvp.times_seen, 0) as times_seen,
           COALESCE(uvp.times_wrong, 0) as times_wrong
         FROM vocabulary v
         INNER JOIN user_vocabulary_progress uvp ON v.id = uvp.vocabulary_id AND uvp.user_id = $1
         WHERE uvp.fsrs_next_review IS NULL OR uvp.fsrs_next_review <= $2
         ORDER BY 
           COALESCE(uvp.fsrs_retrievability, 0.0) ASC,
           COALESCE(uvp.fsrs_review_count, 0) ASC,
           COALESCE(uvp.times_wrong, 0) DESC,
           v.rank ASC
         LIMIT $3`,
        [req.user.id, now, count]
      );
    } else {
      // User has no words in progress - get new words
      result = await pool.query(
        `SELECT 
           v.id, v.hebrew, v.english, v.transliteration,
           0.1 as fsrs_stability,
           5.0 as fsrs_difficulty,
           0.0 as fsrs_retrievability,
           NULL as fsrs_next_review,
           0 as fsrs_review_count,
           0 as times_seen,
           0 as times_wrong
         FROM vocabulary v
         ORDER BY v.rank ASC
         LIMIT $1`,
        [count]
      );
    }
    
    // If we don't have enough words ready for review, get some new words
    if (result.rows.length < count && userWordCount.rows[0].count > 0) {
      const remainingCount = count - result.rows.length;
      const newWordsResult = await pool.query(
        `SELECT 
           v.id, v.hebrew, v.english, v.transliteration,
           0.1 as fsrs_stability,
           5.0 as fsrs_difficulty,
           0.0 as fsrs_retrievability,
           NULL as fsrs_next_review,
           0 as fsrs_review_count,
           0 as times_seen,
           0 as times_wrong
         FROM vocabulary v
         WHERE v.id NOT IN (
           SELECT vocabulary_id FROM user_vocabulary_progress WHERE user_id = $1
         )
         ORDER BY v.rank ASC
         LIMIT $2`,
        [req.user.id, remainingCount]
      );
      
      result.rows = [...result.rows, ...newWordsResult.rows];
    }
    
    const words = result.rows.map(row => row.hebrew);
    
    res.json({ 
      words: words,
      totalAvailable: result.rows.length,
      details: result.rows
    });
  } catch (error) {
    console.error('Error fetching user words:', error);
    res.status(500).json({ error: 'Failed to fetch user words' });
  }
});

// Record progress for a batch of words using FSRS algorithm
// Body: { results: [{ hebrew: '...', correct: true|false }, ...] }
app.post('/api/progress/batch', authenticateToken, async (req, res) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'results array required' });
    }

    // Map hebrew -> vocab id
    const hebrews = results.map(r => r.hebrew);
    const vocabRows = await pool.query(
      'SELECT id, hebrew FROM vocabulary WHERE hebrew = ANY($1)',
      [hebrews]
    );
    const hebrewToId = new Map(vocabRows.rows.map(r => [r.hebrew, r.id]));

    // Apply FSRS updates
    for (const r of results) {
      const vocabId = hebrewToId.get(r.hebrew);
      if (!vocabId) continue;
      
      // Get current FSRS state
      const currentState = await pool.query(
        `SELECT fsrs_stability, fsrs_difficulty, fsrs_retrievability, fsrs_last_review
         FROM user_vocabulary_progress 
         WHERE user_id = $1 AND vocabulary_id = $2`,
        [req.user.id, vocabId]
      );
      
      let stability = 0.1;
      let difficulty = 5.0;
      let retrievability = 0.0;
      const now = new Date();
      
      if (currentState.rows.length > 0) {
        const row = currentState.rows[0];
        stability = row.fsrs_stability || 0.1;
        difficulty = row.fsrs_difficulty || 5.0;
        
        // Calculate current retrievability
        if (row.fsrs_last_review) {
          const timeSinceReview = (now - new Date(row.fsrs_last_review)) / (1000 * 60 * 60 * 24); // days
          retrievability = fsrs.calculateRetrievability(stability, timeSinceReview);
        }
      }
      
      // Map game result to FSRS rating
      const rating = fsrs.gameResultToRating(r.correct, retrievability);
      
      // Update FSRS parameters
      const { newStability, newDifficulty } = fsrs.updateFSRSParameters(
        stability, difficulty, retrievability, rating
      );
      
      // Calculate next interval
      const nextInterval = fsrs.calculateNextInterval(newStability);
      const nextReview = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);
      
      // Update database
      await upsertUserVocabProgress({
        userId: req.user.id,
        vocabId,
        fsrsStability: newStability,
        fsrsDifficulty: newDifficulty,
        fsrsRetrievability: retrievability,
        fsrsLastReview: now,
        fsrsNextReview: nextReview,
        reviewCountDelta: 1,
        seenDelta: 1,
        wrongDelta: r.correct ? 0 : 1
      });
    }

    return res.json({ message: 'FSRS progress recorded' });
  } catch (error) {
    console.error('Error recording FSRS progress:', error);
    return res.status(500).json({ error: 'Failed to record progress' });
  }
});

// Get single random word
app.get('/api/word', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT hebrew, english, transliteration FROM vocabulary ORDER BY RANDOM() LIMIT 1'
    );
    
    if (result.rows.length > 0) {
      res.json({ 
        word: result.rows[0].hebrew,
        english: result.rows[0].english,
        transliteration: result.rows[0].transliteration
      });
    } else {
      res.status(404).json({ error: 'No words found' });
    }
  } catch (error) {
    console.error('Error fetching word:', error);
    res.status(500).json({ error: 'Failed to fetch word' });
  }
});

// Get current user's vocabulary progress list with FSRS data
app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         uvp.id,
         uvp.vocabulary_id,
         uvp.fsrs_stability,
         uvp.fsrs_difficulty,
         uvp.fsrs_retrievability,
         uvp.fsrs_last_review,
         uvp.fsrs_next_review,
         uvp.fsrs_review_count,
         uvp.times_seen,
         uvp.times_wrong,
         uvp.first_seen,
         uvp.last_seen,
         v.hebrew,
         v.rank,
         v.english,
         v.transliteration
       FROM user_vocabulary_progress uvp
       JOIN vocabulary v ON v.id = uvp.vocabulary_id
       WHERE uvp.user_id = $1
       ORDER BY COALESCE(uvp.last_seen, uvp.first_seen) DESC, uvp.id DESC`,
      [req.user.id]
    );
    
    // Calculate progress percentage and learning status for each word
    const progressWithCalculations = result.rows.map(row => {
      const progressPercentage = fsrs.calculateProgressPercentage(
        row.fsrs_stability || 0.1,
        row.fsrs_difficulty || 5.0,
        row.fsrs_review_count || 0
      );
      const learningStatus = fsrs.getLearningStatus(
        row.fsrs_stability || 0.1,
        row.fsrs_review_count || 0
      );
      const daysUntilNextReview = fsrs.getDaysUntilNextReview(row.fsrs_next_review);
      
      return {
        ...row,
        progress_percentage: progressPercentage,
        learning_status: learningStatus,
        days_until_next_review: daysUntilNextReview
      };
    });
    
    return res.json({ progress: progressWithCalculations });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get current user's vocabulary progress list with sorting/filtering using FSRS
app.get('/api/progress/list', authenticateToken, async (req, res) => {
  try {
    // Query params
    const sortByRaw = (req.query.sortBy || 'progress').toString().toLowerCase();
    const sortDirRaw = (req.query.sortDir || 'asc').toString().toLowerCase();
    const progressFilterRaw = (req.query.progress || 'all').toString().toLowerCase(); // 'all' | 'learning' | 'learned' | 'mastered'
    const newWithinHours = req.query.newWithinHours ? Number(req.query.newWithinHours) : null; // e.g., 24

    // Whitelist sorting
    const sortColumns = {
      progress: 'uvp.fsrs_stability', // Use stability as proxy for progress in SQL
      stability: 'uvp.fsrs_stability',
      difficulty: 'uvp.fsrs_difficulty',
      retrievability: 'uvp.fsrs_retrievability',
      reviews: 'uvp.fsrs_review_count',
      alpha: 'v.hebrew',
      seen: 'uvp.times_seen',
      wrong: 'uvp.times_wrong',
      last_seen: 'COALESCE(uvp.last_seen, uvp.first_seen)',
      next_review: 'uvp.fsrs_next_review'
    };
    const sortColumn = sortColumns[sortByRaw] || sortColumns.progress;
    const sortDir = sortDirRaw === 'desc' ? 'DESC' : 'ASC';

    // Build WHERE clause
    const whereClauses = ['uvp.user_id = $1'];
    const values = [req.user.id];

    if (progressFilterRaw === 'learning') {
      whereClauses.push('uvp.fsrs_stability < 1');
    } else if (progressFilterRaw === 'reviewing') {
      whereClauses.push('uvp.fsrs_stability >= 1 AND uvp.fsrs_stability < 5');
    } else if (progressFilterRaw === 'mastered') {
      whereClauses.push('uvp.fsrs_stability >= 5');
    }

    if (newWithinHours && Number.isFinite(newWithinHours) && newWithinHours > 0) {
      values.push(newWithinHours);
      whereClauses.push('uvp.first_seen >= NOW() - INTERVAL \'1 hour\' * $' + values.length);
    }

    const whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT 
        uvp.id,
        uvp.vocabulary_id,
        uvp.fsrs_stability,
        uvp.fsrs_difficulty,
        uvp.fsrs_retrievability,
        uvp.fsrs_last_review,
        uvp.fsrs_next_review,
        uvp.fsrs_review_count,
        uvp.times_seen,
        uvp.times_wrong,
        uvp.first_seen,
        uvp.last_seen,
        v.hebrew,
        v.rank,
        v.english,
        v.transliteration
      FROM user_vocabulary_progress uvp
      JOIN vocabulary v ON v.id = uvp.vocabulary_id
      ${whereSql}
      ORDER BY ${sortColumn} ${sortDir}, uvp.id ASC
    `;

    const result = await pool.query(sql, values);
    
    // Calculate progress percentage and learning status for each word
    const progressWithCalculations = result.rows.map(row => {
      const progressPercentage = fsrs.calculateProgressPercentage(
        row.fsrs_stability || 0.1,
        row.fsrs_difficulty || 5.0,
        row.fsrs_review_count || 0
      );
      const learningStatus = fsrs.getLearningStatus(
        row.fsrs_stability || 0.1,
        row.fsrs_review_count || 0
      );
      const daysUntilNextReview = fsrs.getDaysUntilNextReview(row.fsrs_next_review);
      
      return {
        ...row,
        progress_percentage: progressPercentage,
        learning_status: learningStatus,
        days_until_next_review: daysUntilNextReview
      };
    });
    
    // Sort by progress percentage if that's the requested sort
    if (sortByRaw === 'progress') {
      progressWithCalculations.sort((a, b) => {
        const aProgress = a.progress_percentage;
        const bProgress = b.progress_percentage;
        return sortDir === 'DESC' ? bProgress - aProgress : aProgress - bProgress;
      });
    }
    
    return res.json({ progress: progressWithCalculations });
  } catch (error) {
    console.error('Error fetching sorted/filtered progress:', error);
    return res.status(500).json({ error: 'Failed to fetch progress list' });
  }
});

// Ensure user has at least N learning words (fsrs_stability < 1)
app.post('/api/progress/ensure', authenticateToken, async (req, res) => {
  try {
    const min = Number(req.body?.min) > 0 ? Number(req.body.min) : 20;

    // Count current learning words (stability < 1)
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM user_vocabulary_progress
       WHERE user_id = $1 AND fsrs_stability < 1`,
      [req.user.id]
    );
    const currentLearning = countRes.rows[0].cnt;
    const toAdd = Math.max(0, min - currentLearning);

    let added = [];
    if (toAdd > 0) {
      // Pick random vocab not already in UVP for this user
      const pick = await pool.query(
        `SELECT v.id
         FROM vocabulary v
         WHERE NOT EXISTS (
           SELECT 1 FROM user_vocabulary_progress uvp
           WHERE uvp.user_id = $1 AND uvp.vocabulary_id = v.id
         )
         ORDER BY RANDOM() LIMIT $2`,
        [req.user.id, toAdd]
      );

      if (pick.rows.length > 0) {
        const values = pick.rows.map((r) => `(${req.user.id}, ${r.id}, 0.1, 5.0, 0.0, NOW(), NOW(), 0, 0, 0)`);
        await pool.query(
          `INSERT INTO user_vocabulary_progress (
             user_id, vocabulary_id, fsrs_stability, fsrs_difficulty, fsrs_retrievability,
             fsrs_last_review, fsrs_next_review, fsrs_review_count, times_seen, times_wrong
           )
           VALUES ${values.join(', ')}
           ON CONFLICT (user_id, vocabulary_id) DO NOTHING`
        );
        added = pick.rows.map(r => r.id);
      }
    }

    // Return updated snapshot
    const snapshot = await pool.query(
      `SELECT 
         uvp.id,
         uvp.vocabulary_id,
         uvp.fsrs_stability,
         uvp.fsrs_difficulty,
         uvp.fsrs_retrievability,
         uvp.fsrs_last_review,
         uvp.fsrs_next_review,
         uvp.fsrs_review_count,
         uvp.times_seen,
         uvp.times_wrong,
         uvp.first_seen,
         uvp.last_seen,
         v.hebrew,
         v.rank,
         v.english,
         v.transliteration
       FROM user_vocabulary_progress uvp
       JOIN vocabulary v ON v.id = uvp.vocabulary_id
       WHERE uvp.user_id = $1 AND uvp.fsrs_stability < 1
       ORDER BY COALESCE(uvp.last_seen, uvp.first_seen) DESC, uvp.id DESC`,
      [req.user.id]
    );

    // Calculate progress percentage and learning status for each word
    const progressWithCalculations = snapshot.rows.map(row => {
      const progressPercentage = fsrs.calculateProgressPercentage(
        row.fsrs_stability || 0.1,
        row.fsrs_difficulty || 5.0,
        row.fsrs_review_count || 0
      );
      const learningStatus = fsrs.getLearningStatus(
        row.fsrs_stability || 0.1,
        row.fsrs_review_count || 0
      );
      const daysUntilNextReview = fsrs.getDaysUntilNextReview(row.fsrs_next_review);
      
      return {
        ...row,
        progress_percentage: progressPercentage,
        learning_status: learningStatus,
        days_until_next_review: daysUntilNextReview
      };
    });

    return res.json({ ensuredMin: min, currentLearning: progressWithCalculations.length, addedCount: added.length, learning: progressWithCalculations });
  } catch (error) {
    console.error('Error ensuring learning minimum:', error);
    return res.status(500).json({ error: 'Failed to ensure learning minimum' });
  }
});

// Auto-manage user's vocabulary list - add new words based on time and progress
app.post('/api/progress/auto-manage', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    
    // Get user's current vocabulary stats
    const stats = await pool.query(
      `SELECT 
         COUNT(*) as total_words,
         COUNT(CASE WHEN fsrs_stability < 1 THEN 1 END) as learning_words,
         COUNT(CASE WHEN fsrs_stability >= 1 AND fsrs_stability < 5 THEN 1 END) as reviewing_words,
         COUNT(CASE WHEN fsrs_stability >= 5 THEN 1 END) as mastered_words,
         MAX(first_seen) as last_word_added
       FROM user_vocabulary_progress 
       WHERE user_id = $1`,
      [req.user.id]
    );
    
    const userStats = stats.rows[0];
    const totalWords = parseInt(userStats.total_words) || 0;
    const learningWords = parseInt(userStats.learning_words) || 0;
    const reviewingWords = parseInt(userStats.reviewing_words) || 0;
    const masteredWords = parseInt(userStats.mastered_words) || 0;
    const lastWordAdded = userStats.last_word_added;
    
    // Calculate days since last word was added
    const daysSinceLastWord = lastWordAdded 
      ? (now - new Date(lastWordAdded)) / (1000 * 60 * 60 * 24)
      : 999; // If no words, treat as "long time ago"
    
    // Determine if we should add new words
    let shouldAddWords = false;
    let reason = '';
    let wordsToAdd = 0;
    
    // Rule 1: Add words if it's been more than 1 day since last word
    if (daysSinceLastWord >= 1) {
      shouldAddWords = true;
      reason = 'Daily word addition';
      wordsToAdd = Math.min(5, Math.floor(daysSinceLastWord)); // 1-5 words per day
    }
    
    // Rule 2: Add words if learning words are getting low (less than 10)
    if (learningWords < 10 && totalWords > 0) {
      shouldAddWords = true;
      reason = 'Low learning words';
      wordsToAdd = Math.max(wordsToAdd, 10 - learningWords);
    }
    
    // Rule 3: Add words if user has mastered most of their current words (80%+ mastered)
    const masteryRate = totalWords > 0 ? masteredWords / totalWords : 0;
    if (masteryRate >= 0.8 && totalWords > 0) {
      shouldAddWords = true;
      reason = 'High mastery rate';
      wordsToAdd = Math.max(wordsToAdd, 5);
    }
    
    // Rule 4: Add words if user has no words at all
    if (totalWords === 0) {
      shouldAddWords = true;
      reason = 'First time user';
      wordsToAdd = 20; // Start with 20 words
    }
    
    let addedWords = [];
    if (shouldAddWords && wordsToAdd > 0) {
      // Get new words not already in user's vocabulary
      const newWordsResult = await pool.query(
        `SELECT v.id, v.hebrew, v.english, v.transliteration, v.rank
         FROM vocabulary v
         WHERE NOT EXISTS (
           SELECT 1 FROM user_vocabulary_progress uvp
           WHERE uvp.user_id = $1 AND uvp.vocabulary_id = v.id
         )
         ORDER BY v.rank ASC
         LIMIT $2`,
        [req.user.id, wordsToAdd]
      );
      
      if (newWordsResult.rows.length > 0) {
        // Insert new words into user's vocabulary
        const values = newWordsResult.rows.map((r) => 
          `(${req.user.id}, ${r.id}, 0.1, 5.0, 0.0, NOW(), NOW(), 0, 0, 0)`
        );
        
        await pool.query(
          `INSERT INTO user_vocabulary_progress (
             user_id, vocabulary_id, fsrs_stability, fsrs_difficulty, fsrs_retrievability,
             fsrs_last_review, fsrs_next_review, fsrs_review_count, times_seen, times_wrong
           )
           VALUES ${values.join(', ')}
           ON CONFLICT (user_id, vocabulary_id) DO NOTHING`
        );
        
        addedWords = newWordsResult.rows.map(r => ({
          id: r.id,
          hebrew: r.hebrew,
          english: r.english,
          transliteration: r.transliteration,
          rank: r.rank
        }));
      }
    }
    
    // Return updated stats
    const updatedStats = await pool.query(
      `SELECT 
         COUNT(*) as total_words,
         COUNT(CASE WHEN fsrs_stability < 1 THEN 1 END) as learning_words,
         COUNT(CASE WHEN fsrs_stability >= 1 AND fsrs_stability < 5 THEN 1 END) as reviewing_words,
         COUNT(CASE WHEN fsrs_stability >= 5 THEN 1 END) as mastered_words
       FROM user_vocabulary_progress 
       WHERE user_id = $1`,
      [req.user.id]
    );
    
    const updated = updatedStats.rows[0];
    
    return res.json({
      action: shouldAddWords ? 'added_words' : 'no_action_needed',
      reason: reason,
      wordsAdded: addedWords.length,
      addedWords: addedWords,
      stats: {
        totalWords: parseInt(updated.total_words),
        learningWords: parseInt(updated.learning_words),
        reviewingWords: parseInt(updated.reviewing_words),
        masteredWords: parseInt(updated.mastered_words),
        masteryRate: updated.total_words > 0 ? parseInt(updated.mastered_words) / parseInt(updated.total_words) : 0
      },
      daysSinceLastWord: Math.floor(daysSinceLastWord)
    });
    
  } catch (error) {
    console.error('Error auto-managing vocabulary:', error);
    return res.status(500).json({ error: 'Failed to auto-manage vocabulary' });
  }
});

// Submit score endpoint (no-op: scores table removed)
app.post('/api/scores', async (req, res) => {
  try {
    const { score, wordsAttempted, wordsCorrect, sessionDuration, wordsPerMinute } = req.body;
    if (score == null || wordsAttempted == null || wordsCorrect == null || sessionDuration == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const experienceGained = Math.floor((Number(score) || 0) / 10) + ((Number(wordsCorrect) || 0) * 5);
    // Since scores table was removed per new design, simply echo back success
    return res.json({ 
      message: 'Score received (not persisted by design)',
      finalScore: score,
      wordsAttempted,
      wordsCorrect,
      sessionDuration,
      wordsPerMinute: wordsPerMinute || null,
      experienceGained
    });
  } catch (error) {
    console.error('Error handling score:', error);
    return res.status(500).json({ error: 'Failed to handle score' });
  }
});

// Get leaderboard (top scores)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await pool.query(
      'SELECT score, words_correct, words_per_minute, created_at FROM scores ORDER BY words_per_minute DESC, score DESC LIMIT $1',
      [limit]
    );
    
    res.json({ 
      leaderboard: result.rows,
      totalScores: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get vocabulary statistics
app.get('/api/stats', async (req, res) => {
  try {
    const vocabCount = await pool.query('SELECT COUNT(*) FROM vocabulary');
    const scoresCount = await pool.query('SELECT COUNT(*) FROM scores');
    const avgWPM = await pool.query('SELECT AVG(words_per_minute) FROM scores WHERE words_per_minute > 0');
    
    res.json({
      totalWords: parseInt(vocabCount.rows[0].count),
      totalScores: parseInt(scoresCount.rows[0].count),
      averageWordsPerMinute: parseFloat(avgWPM.rows[0].avg) || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Network: http://YOUR_IP_ADDRESS:${PORT}`);
});