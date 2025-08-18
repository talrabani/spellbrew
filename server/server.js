const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db/db');
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

// Helper: get or create a user_vocabulary_progress row
async function upsertUserVocabProgress({ userId, vocabId, learnedDelta = 0, seenDelta = 0, wrongDelta = 0 }) {
  // Try update existing, otherwise insert
  const updated = await pool.query(
    `UPDATE user_vocabulary_progress
     SET learned_score = GREATEST(0, learned_score + $1),
         times_seen = times_seen + $2,
         times_wrong = times_wrong + $3,
         last_seen = CURRENT_TIMESTAMP
     WHERE user_id = $4 AND vocabulary_id = $5
     RETURNING id`,
    [learnedDelta, seenDelta, wrongDelta, userId, vocabId]
  );
  if (updated.rowCount > 0) return updated.rows[0];
  const inserted = await pool.query(
    `INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, learned_score, times_seen, times_wrong, first_seen, last_seen)
     VALUES ($1, $2, GREATEST(0,$3), $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, vocabulary_id) DO UPDATE SET
       learned_score = GREATEST(0, user_vocabulary_progress.learned_score + EXCLUDED.learned_score),
       times_seen = user_vocabulary_progress.times_seen + EXCLUDED.times_seen,
       times_wrong = user_vocabulary_progress.times_wrong + EXCLUDED.times_wrong,
       last_seen = CURRENT_TIMESTAMP
     RETURNING id`,
    [userId, vocabId, learnedDelta, seenDelta, wrongDelta]
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

// Get batch of random words from database
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

// Record progress for a batch of words the user just practiced
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

    // Apply updates
    for (const r of results) {
      const vocabId = hebrewToId.get(r.hebrew);
      if (!vocabId) continue;
      const learnedDelta = r.correct ? 1 : -1; // simple heuristic; can be tuned
      const seenDelta = 1;
      const wrongDelta = r.correct ? 0 : 1;
      await upsertUserVocabProgress({
        userId: req.user.id,
        vocabId,
        learnedDelta,
        seenDelta,
        wrongDelta
      });
    }

    return res.json({ message: 'Progress recorded' });
  } catch (error) {
    console.error('Error recording progress:', error);
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

// Get current user's vocabulary progress list
app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         uvp.id,
         uvp.vocabulary_id,
         uvp.learned_score,
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
    return res.json({ progress: result.rows });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Ensure user has at least N learning words (learned_score < 5)
app.post('/api/progress/ensure', authenticateToken, async (req, res) => {
  try {
    const min = Number(req.body?.min) > 0 ? Number(req.body.min) : 15;

    // Count current learning words
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM user_vocabulary_progress
       WHERE user_id = $1 AND learned_score < 5`,
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
        const values = pick.rows.map((r) => `(${req.user.id}, ${r.id}, 0, 0, 0)`);
        await pool.query(
          `INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, learned_score, times_seen, times_wrong)
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
         uvp.learned_score,
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
       WHERE uvp.user_id = $1 AND uvp.learned_score < 5
       ORDER BY COALESCE(uvp.last_seen, uvp.first_seen) DESC, uvp.id DESC`,
      [req.user.id]
    );

    return res.json({ ensuredMin: min, currentLearning: snapshot.rows.length, addedCount: added.length, learning: snapshot.rows });
  } catch (error) {
    console.error('Error ensuring learning minimum:', error);
    return res.status(500).json({ error: 'Failed to ensure learning minimum' });
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