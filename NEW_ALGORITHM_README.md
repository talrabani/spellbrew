# New Word Selection Algorithm

## Overview

The Spellbrew Hebrew learning game now uses a **simplified word selection algorithm** instead of the complex FSRS (Free Spaced Repetition Scheduler). This new algorithm is specifically designed for spelling games and focuses on three key factors:

1. **Time since last seen** - Words not seen recently get higher priority
2. **Word difficulty** - Words with more errors get higher priority  
3. **Word stages** - Different display times based on learning progress

## Algorithm Features

### Word Stages

The algorithm categorizes words into four learning stages:

| Stage | Times Seen | Display Time | Description |
|-------|------------|--------------|-------------|
| **New** | 0-2 | Unlimited | Just introduced, no time pressure |
| **Learning** | 3-9 | 5 seconds | Still being learned, moderate time |
| **Practicing** | 10-24 | 3 seconds | Building speed, shorter time |
| **Known** | 25+ | 1.5 seconds | Mastered, very fast display |

### Priority Calculation

Words are selected based on a weighted priority score:

```javascript
Priority Score = (Difficulty × 0.4) + (Time Priority × 0.4) + (Stage Bonus × 0.2)
```

Where:
- **Difficulty** (0-100): Based on error rate (times wrong / times seen)
- **Time Priority** (0-100): Days since last seen (capped at 30 days)
- **Stage Bonus** (0-20): Extra priority for new words

### Word Selection Process

1. **Separate new and existing words**
2. **Calculate priority scores** for existing words
3. **Sort by priority** (highest first)
4. **Mix new and review words** (30% new, 70% review)
5. **Shuffle final selection** for variety

## Database Schema

The new algorithm uses a simplified database schema:

```sql
CREATE TABLE user_vocabulary_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    vocabulary_id INTEGER NOT NULL,
    times_seen INTEGER DEFAULT 0,        -- How many times seen
    times_wrong INTEGER DEFAULT 0,       -- How many times wrong
    word_stage VARCHAR(20) DEFAULT 'new', -- Current learning stage
    display_time INTEGER,                -- Display time in milliseconds
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    UNIQUE (user_id, vocabulary_id)
);
```

## API Changes

### Word Selection (`GET /api/words/user`)

Returns words with priority information:

```json
{
  "words": ["שָׁלוֹם", "תּוֹדָה"],
  "totalAvailable": 20,
  "details": [
    {
      "hebrew": "שָׁלוֹם",
      "priority": {
        "priorityScore": 85,
        "wordStage": "new",
        "displayTime": null,
        "difficulty": 50,
        "timePriority": 100
      }
    }
  ]
}
```

### Progress Recording (`POST /api/progress/batch`)

Updates word progress and automatically advances stages:

```json
{
  "results": [
    {"hebrew": "שָׁלוֹם", "correct": true},
    {"hebrew": "תּוֹדָה", "correct": false}
  ]
}
```

### Progress Retrieval (`GET /api/progress`)

Returns progress with new algorithm data:

```json
{
  "progress": [
    {
      "hebrew": "שָׁלוֹם",
      "times_seen": 5,
      "times_wrong": 1,
      "word_stage": "learning",
      "display_time": 5000,
      "progress_percentage": 45,
      "difficulty": 20,
      "priority_score": 65
    }
  ]
}
```

## Migration from FSRS

To migrate existing data from FSRS to the new algorithm:

1. **Run the migration script**:
   ```bash
   psql -d your_database -f server/db/migrate-from-fsrs.sql
   ```

2. **Update your application** to use the new API responses

3. **Test the new algorithm**:
   ```bash
   node test-new-algorithm.js
   ```

## Benefits of the New Algorithm

### 1. **Simpler and Faster**
- No complex mathematical calculations
- Faster database queries
- Easier to understand and debug

### 2. **Game-Optimized**
- Designed specifically for spelling games
- Progressive display times encourage speed improvement
- Immediate feedback on learning progress

### 3. **Adaptive Learning**
- Automatically adjusts to user performance
- Prioritizes struggling words
- Balances new and review content

### 4. **Transparent Logic**
- Clear progression through learning stages
- Easy to explain to users
- Predictable behavior

## Configuration

You can adjust the algorithm parameters in `server/word-selection.js`:

```javascript
// Word stage thresholds
const WORD_STAGES = {
  NEW: { minSeenCount: 0, maxSeenCount: 2, displayTime: null },
  LEARNING: { minSeenCount: 3, maxSeenCount: 9, displayTime: 5000 },
  PRACTICING: { minSeenCount: 10, maxSeenCount: 24, displayTime: 3000 },
  KNOWN: { minSeenCount: 25, maxSeenCount: null, displayTime: 1500 }
};

// Priority weights
const difficultyWeight = 0.4;  // 40% weight
const timeWeight = 0.4;        // 40% weight  
const stageWeight = 0.2;       // 20% weight
```

## Testing

Use the provided test script to verify the algorithm works correctly:

```bash
# Start the server
cd server && npm start

# In another terminal, run the test
node test-new-algorithm.js
```

The test will:
1. Create a test user
2. Test word selection
3. Simulate game sessions
4. Verify progress tracking
5. Show detailed analysis

## Future Enhancements

Potential improvements to consider:

1. **Personalized timing** - Adjust display times based on individual user speed
2. **Difficulty categories** - Group words by complexity (short vs long words)
3. **Learning patterns** - Track time-of-day performance
4. **Spaced repetition** - Add back some time-based spacing for long-term retention
5. **Progress analytics** - Detailed learning statistics and insights

## Conclusion

The new word selection algorithm provides a simpler, more effective approach for spelling games. It focuses on the core learning objectives while maintaining the benefits of adaptive difficulty and spaced repetition in a more accessible format.
