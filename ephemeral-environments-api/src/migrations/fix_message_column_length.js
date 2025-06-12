const { logger } = require('../utils/logger');
const { getDb } = require('../database');

/**
 * Fix message column length in environment_logs table
 * Change from TEXT to LONGTEXT to support larger error messages
 */
async function fixMessageColumnLength() {
  try {
    const db = getDb();

    // Check if the environment_logs table exists
    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'environment_logs'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (tables.length === 0) {
      logger.info('environment_logs table does not exist, skipping message column fix');
      return { success: true };
    }

    // Check current column type
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'environment_logs'
      AND COLUMN_NAME = 'message'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (columns.length === 0) {
      logger.info('message column does not exist in environment_logs table, skipping fix');
      return { success: true };
    }

    const currentColumn = columns[0];

    // Check if it's already LONGTEXT
    if (currentColumn.DATA_TYPE === 'longtext') {
      logger.info('message column is already LONGTEXT, no changes needed');
      return { success: true };
    }

    // Alter the column to LONGTEXT
    await db.query(`
      ALTER TABLE environment_logs
      MODIFY COLUMN message LONGTEXT
    `);

    logger.info(`Successfully changed message column from ${currentColumn.DATA_TYPE} to LONGTEXT`);

    return { success: true };
  } catch (err) {
    logger.error(`Error fixing message column length: ${err.message}`);
    throw err;
  }
}

module.exports = {
  fixMessageColumnLength
};
