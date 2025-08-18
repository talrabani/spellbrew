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

// Submit score endpoint
app.post('/api/scores', async (req, res) => {
  try {
    const { score, wordsAttempted, wordsCorrect, sessionDuration, wordsPerMinute } = req.body;
    
    // Validate required fields
    if (!score || !wordsAttempted || !wordsCorrect || !sessionDuration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Calculate experience gained (simple formula)
    const experienceGained = Math.floor(score / 10) + (wordsCorrect * 5);
    
    // Insert score into database
    const result = await pool.query(
      'INSERT INTO scores (score, words_attempted, words_correct, session_duration, words_per_minute, experience_gained) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [score, wordsAttempted, wordsCorrect, sessionDuration, wordsPerMinute || null, experienceGained]
    );
    
    console.log('Score submitted:', { 
      id: result.rows[0].id,
      score, 
      wordsAttempted, 
      wordsCorrect, 
      sessionDuration,
      wordsPerMinute,
      experienceGained
    });
    
    res.json({ 
      message: 'Score recorded successfully',
      scoreId: result.rows[0].id,
      finalScore: score,
      experienceGained
    });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
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