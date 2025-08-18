const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// First, connect to the default 'postgres' database to create our database
const adminPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default database first
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Then connect to our actual database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'spellbrew',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // First, try to create the database if it doesn't exist
    try {
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'spellbrew'}`);
      console.log(`Database '${process.env.DB_NAME || 'spellbrew'}' created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`Database '${process.env.DB_NAME || 'spellbrew'}' already exists`);
      } else {
        console.log('Note: Could not create database (this is normal if it already exists)');
      }
    }

    // Close admin connection
    await adminPool.end();

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('Database schema created successfully');

    // Check if vocabulary table is empty
    const vocabCount = await pool.query('SELECT COUNT(*) FROM vocabulary');
    
    if (parseInt(vocabCount.rows[0].count) === 0) {
      console.log('Loading vocabulary data...');
      
      // Read vocabulary JSON file from db folder
      const vocabPath = path.join(__dirname, 'vocab.json'); // Updated path
      const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
      
      // Insert vocabulary data
      for (const word of vocabData) {
        await pool.query(
          'INSERT INTO vocabulary (hebrew, rank, english, transliteration) VALUES ($1, $2, $3, $4) ON CONFLICT (hebrew) DO NOTHING',
          [
            word.hebrew,
            word.rank,
            word.english,
            word.transliteration
          ]
        );
      }
      
      console.log(`Loaded ${vocabData.length} vocabulary words`);
    } else {
      console.log('Vocabulary data already exists, skipping...');
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end(); // Ensure pool is ended
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = initDatabase;
