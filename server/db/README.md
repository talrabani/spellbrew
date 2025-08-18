# Database Module

This folder contains all database-related files for the Spellbrew server.

## Files

- **`db.js`** - Database connection configuration using PostgreSQL
- **`schema.sql`** - Database table definitions and indexes
- **`init-db.js`** - Database initialization script that creates tables and loads vocabulary data
- **`README.md`** - This documentation file

## Database Schema

### Tables

1. **`vocabulary`** - Hebrew words with English translations and transliterations
   - `id` (SERIAL PRIMARY KEY)
   - `hebrew` (VARCHAR(50) UNIQUE) - Hebrew word
   - `rank` (INTEGER) - Word frequency rank
   - `english` (TEXT[]) - Array of English translations
   - `transliteration` (TEXT[]) - Array of transliterations
   - `rank_estimated` (BOOLEAN) - Whether rank was estimated
   - `created_at` (TIMESTAMP) - Creation timestamp

2. **`scores`** - Game scores and performance metrics
   - `id` (SERIAL PRIMARY KEY)
   - `score` (INTEGER) - Total game score
   - `words_attempted` (INTEGER) - Number of words attempted
   - `words_correct` (INTEGER) - Number of words correct
   - `session_duration` (INTEGER) - Session duration in milliseconds
   - `words_per_minute` (INTEGER) - Words per minute calculation
   - `created_at` (TIMESTAMP) - Score timestamp

## Usage

### Initialize Database
```bash
npm run init-db
```

This will:
1. Create all database tables
2. Load 9,620 Hebrew vocabulary words from `../client/public/vocab.json`
3. Set up indexes for optimal performance

### Database Connection
```javascript
const pool = require('./db/db');
```

## Environment Variables

The database connection uses these environment variables (set in `.env`):

- `DB_USER` - PostgreSQL username (default: 'postgres')
- `DB_HOST` - Database host (default: 'localhost')
- `DB_NAME` - Database name (default: 'spellbrew')
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port (default: 5432)
