const { Pool } = require('pg');
require('dotenv').config();

// Connect to the default 'postgres' database to drop and recreate our database
const adminPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default database first
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function resetDatabase() {
  try {
    console.log('Resetting database...');

    // Drop the existing database if it exists
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'spellbrew'}`);
      console.log(`Database '${process.env.DB_NAME || 'spellbrew'}' dropped successfully`);
    } catch (error) {
      console.log('Note: Could not drop database (this is normal if it doesn\'t exist)');
    }

    // Create the database fresh
    await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'spellbrew'}`);
    console.log(`Database '${process.env.DB_NAME || 'spellbrew'}' created successfully`);

    // Close admin connection
    await adminPool.end();

    console.log('Database reset completed successfully');
    console.log('Now run: npm run init-db');
    
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('Database reset complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database reset failed:', error);
      process.exit(1);
    });
}

module.exports = resetDatabase;
