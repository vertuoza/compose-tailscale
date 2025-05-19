const { logger } = require('../utils/logger');
const { getDb } = require('../database');

/**
 * Update environments table to make repository_name and pr_number nullable
 * for DEMO environments
 */
async function updateEnvironmentSchema() {
  try {
    const db = getDb();

    // Check if the environment_type column exists
    const [envTypeColumns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'environments'
      AND COLUMN_NAME = 'environment_type'
    `);

    // If environment_type column doesn't exist, we need to add it first
    if (envTypeColumns.length === 0) {
      await db.query(`
        ALTER TABLE environments
        ADD COLUMN environment_type VARCHAR(10) DEFAULT 'qa'
      `);
      logger.info('Added environment_type column to environments table');
    }

    // Modify repository_name and pr_number columns to be nullable
    await db.query(`
      ALTER TABLE environments
      MODIFY COLUMN repository_name VARCHAR(255) NULL
    `);
    logger.info('Modified repository_name column to be nullable');

    await db.query(`
      ALTER TABLE environments
      MODIFY COLUMN pr_number INT NULL
    `);
    logger.info('Modified pr_number column to be nullable');

    return { success: true };
  } catch (err) {
    logger.error(`Error updating environment schema: ${err.message}`);
    throw err;
  }
}

module.exports = {
  updateEnvironmentSchema
};
