const { logger } = require('../utils/logger');
const { getDb } = require('../database');

/**
 * Add environment_type column to environments table
 */
async function addEnvironmentTypeColumn() {
  try {
    const db = getDb();

    // Check if the column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'environments'
      AND COLUMN_NAME = 'environment_type'
    `);

    if (columns.length === 0) {
      // Column doesn't exist, add it
      await db.query(`
        ALTER TABLE environments
        ADD COLUMN environment_type VARCHAR(10) DEFAULT 'qa'
      `);
      logger.info('Added environment_type column to environments table');
    } else {
      logger.info('environment_type column already exists in environments table');
    }

    return { success: true };
  } catch (err) {
    logger.error(`Error adding environment_type column: ${err.message}`);
    throw err;
  }
}

module.exports = {
  addEnvironmentTypeColumn
};
