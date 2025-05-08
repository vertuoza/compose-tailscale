const sqlite3 = require('sqlite3').verbose();
const { logger } = require('./utils/logger');
const fileSystem = require('./utils/fileSystem');
const fs = require('fs-extra');

// Ensure the data directory exists
const dataDir = fileSystem.joinPath(__dirname, '../data');
fs.ensureDirSync(dataDir);

// Database file path
const dbPath = process.env.DB_PATH || fileSystem.joinPath(dataDir, 'pr-environments.db');

// Initialize database
function setupDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error(`Error opening database: ${err.message}`);
      process.exit(1);
    }
    logger.info('Connected to the PR environments database.');
  });

  // Create tables if they don't exist
  db.serialize(() => {
    // Environments table
    db.run(`
      CREATE TABLE IF NOT EXISTS environments (
        id TEXT PRIMARY KEY,
        service_name TEXT NOT NULL,
        pr_number INTEGER NOT NULL,
        status TEXT NOT NULL,
        url TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        logger.error(`Error creating environments table: ${err.message}`);
      } else {
        logger.info('Environments table ready');
      }
    });

    // Logs table for environment operations
    db.run(`
      CREATE TABLE IF NOT EXISTS environment_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        environment_id TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (environment_id) REFERENCES environments (id)
      )
    `, (err) => {
      if (err) {
        logger.error(`Error creating environment_logs table: ${err.message}`);
      } else {
        logger.info('Environment logs table ready');
      }
    });

  });

  return db;
}

// Get database connection
function getDb() {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      logger.error(`Error opening database: ${err.message}`);
      throw err;
    }
  });
}

// Helper to run a query with promises
function run(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(query, params, function(err) {
      db.close();
      if (err) {
        logger.error(`Error running query: ${query}, Error: ${err.message}`);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Helper to get a single row
function get(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(query, params, (err, row) => {
      db.close();
      if (err) {
        logger.error(`Error getting row: ${query}, Error: ${err.message}`);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper to get all rows
function all(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(query, params, (err, rows) => {
      db.close();
      if (err) {
        logger.error(`Error getting all rows: ${query}, Error: ${err.message}`);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  setupDatabase,
  getDb,
  run,
  get,
  all
};
