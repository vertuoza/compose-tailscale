const mysql = require('mysql2/promise');
const { logger } = require('./utils/logger');

// MySQL connection pool
let pool = null;

// Helper function to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize database connection pool with retry mechanism
async function setupDatabase(retries = 5, delay = 5000) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create connection pool
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'mysql',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'prenvuser',
        password: process.env.MYSQL_PASSWORD || 'prenvpassword',
        database: process.env.MYSQL_DATABASE || 'pr_environments',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test the connection
      await pool.query('SELECT 1');

      logger.info(`Successfully connected to MySQL database on attempt ${attempt}`);

      // Create tables if they don't exist
      // Environments table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS environments (
          id VARCHAR(255) PRIMARY KEY,
          repository_name VARCHAR(255) NOT NULL,
          services_data TEXT NOT NULL,
          pr_number INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          url VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      logger.info('Environments table ready');

      // Logs table for environment operations
      await pool.query(`
        CREATE TABLE IF NOT EXISTS environment_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          environment_id VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (environment_id) REFERENCES environments (id)
        )
      `);
      logger.info('Environment logs table ready');

      return pool;
    } catch (err) {
      lastError = err;
      logger.warn(`Database connection attempt ${attempt} failed: ${err.message}`);

      if (attempt < retries) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
      }
    }
  }

  // If we get here, all retries failed
  logger.error(`Failed to connect to database after ${retries} attempts: ${lastError.message}`);
  process.exit(1);
}

// Get database connection pool
function getDb() {
  if (!pool) {
    logger.error('Database connection pool not initialized');
    throw new Error('Database connection pool not initialized');
  }
  return pool;
}

// Helper to run a query with promises
async function run(query, params = []) {
  try {
    const database = getDb();
    const [result] = await database.query(query, params);
    return {
      id: result.insertId,
      changes: result.affectedRows
    };
  } catch (err) {
    logger.error(`Error running query: ${query}, Error: ${err.message}`);
    throw err;
  }
}

// Helper to get a single row
async function get(query, params = []) {
  try {
    const database = getDb();
    const [rows] = await database.query(query, params);
    return rows[0];
  } catch (err) {
    logger.error(`Error getting row: ${query}, Error: ${err.message}`);
    throw err;
  }
}

// Helper to get all rows
async function all(query, params = []) {
  try {
    const database = getDb();
    const [rows] = await database.query(query, params);
    return rows;
  } catch (err) {
    logger.error(`Error getting all rows: ${query}, Error: ${err.message}`);
    throw err;
  }
}

module.exports = {
  setupDatabase,
  getDb,
  run,
  get,
  all
};
