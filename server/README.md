# Spellbrew Server with PostgreSQL

This is the backend server for the Spellbrew Hebrew learning game, now with PostgreSQL database support.

## Project Structure

```
server/
├── db/                    # Database module
│   ├── db.js             # Database connection configuration
│   ├── schema.sql        # Database table definitions
│   ├── init-db.js        # Database initialization script
│   └── README.md         # Database documentation
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
├── env.example           # Environment variables template
└── README.md             # This file
```

## Prerequisites

1. **PostgreSQL** installed and running on your system
2. **Node.js** (version 14 or higher)

## Setup Instructions

### 1. Install PostgreSQL

**Windows:**
- Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
- During installation, note down the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
# Connect as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE spellbrew;

# Exit psql
\q
```

### 3. Configure Environment Variables

Copy the environment template and configure your database settings:

```bash
cp env.example .env
```

Edit `.env` file with your database credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=spellbrew
DB_PASSWORD=your_actual_password
DB_PORT=5432
PORT=5000
NODE_ENV=development
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Initialize Database

This will create the tables and load the vocabulary data:

```bash
npm run init-db
```

### 6. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

- `GET /api/words?count=20` - Get random Hebrew words
- `GET /api/word` - Get a single random word
- `POST /api/scores` - Submit game score
- `GET /api/leaderboard?limit=10` - Get top scores
- `GET /api/stats` - Get vocabulary and game statistics

## Database Module

The database functionality is organized in the `db/` folder:

- **`db/db.js`** - PostgreSQL connection pool configuration
- **`db/schema.sql`** - Database table definitions and indexes
- **`db/init-db.js`** - Database initialization and vocabulary loading
- **`db/README.md`** - Detailed database documentation

### Key Features

- **9,620 unique Hebrew words** loaded from the parsed vocabulary
- **Score tracking** with words per minute calculation
- **Leaderboard functionality** for competitive play
- **Performance statistics** and analytics

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   services.msc  # Check PostgreSQL service

   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. Check your `.env` file has correct credentials

3. Test connection manually:
   ```bash
   psql -h localhost -U postgres -d spellbrew
   ```

### Database Reset

To reset the database and reload vocabulary:

```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS spellbrew;"
sudo -u postgres psql -c "CREATE DATABASE spellbrew;"

# Reinitialize
npm run init-db
```
