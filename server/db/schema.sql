-- Create database schema for Spellbrew Hebrew learning game

-- Vocabulary words table
CREATE TABLE IF NOT EXISTS vocabulary (
    id SERIAL PRIMARY KEY,
    hebrew VARCHAR(50) NOT NULL UNIQUE,
    rank INTEGER,
    english TEXT[],
    transliteration TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-specific vocabulary progress table
-- Tracks FSRS (Free Spaced Repetition Scheduler) parameters for each vocabulary word
CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    fsrs_stability DECIMAL(10,4) DEFAULT 0.1,      -- How well the word is learned (increases with successful reviews)
    fsrs_difficulty DECIMAL(10,4) DEFAULT 5.0,     -- How hard the word is for the user (personalized)
    fsrs_retrievability DECIMAL(10,4) DEFAULT 0.0, -- Current likelihood of remembering (0-1 scale)
    fsrs_last_review TIMESTAMP,                    -- When the word was last reviewed
    fsrs_next_review TIMESTAMP,                    -- When the word should be reviewed next
    fsrs_review_count INTEGER DEFAULT 0,           -- Total number of reviews
    times_seen INTEGER DEFAULT 0,                  -- How many times the user has seen this word
    times_wrong INTEGER DEFAULT 0,                 -- How many times the user got this word wrong
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    UNIQUE (user_id, vocabulary_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_rank ON vocabulary(rank);
CREATE INDEX IF NOT EXISTS idx_vocabulary_hebrew ON vocabulary(hebrew);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_uvp_user_id ON user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_uvp_vocab_id ON user_vocabulary_progress(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_uvp_fsrs_stability ON user_vocabulary_progress(fsrs_stability);
CREATE INDEX IF NOT EXISTS idx_uvp_fsrs_next_review ON user_vocabulary_progress(fsrs_next_review);
CREATE INDEX IF NOT EXISTS idx_uvp_fsrs_retrievability ON user_vocabulary_progress(fsrs_retrievability);
