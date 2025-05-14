const fs = require('fs-extra');
const path = require('path');
const { logger } = require('./logger');

/**
 * Join path segments
 * @param {...string} paths - Path segments to join
 * @returns {string} - Joined path
 */
function joinPath(...paths) {
  return path.join(...paths);
}

/**
 * Ensure a directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    logger.debug(`Ensured directory exists: ${dirPath}`);
  } catch (err) {
    logger.error(`Error ensuring directory exists: ${err.message}`);
    throw err;
  }
}

/**
 * Copy a directory recursively
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 * @returns {Promise<void>}
 */
async function copyDirectory(source, destination) {
  try {
    await fs.copy(source, destination);
    logger.debug(`Copied directory from ${source} to ${destination}`);
  } catch (err) {
    logger.error(`Error copying directory: ${err.message}`);
    throw err;
  }
}

/**
 * Read a file
 * @param {string} filePath - File path
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {Promise<string>} - File content
 */
async function readFile(filePath, encoding = 'utf8') {
  try {
    const content = await fs.readFile(filePath, encoding);
    logger.debug(`Read file: ${filePath}`);
    return content;
  } catch (err) {
    logger.error(`Error reading file: ${err.message}`);
    throw err;
  }
}

/**
 * Write to a file
 * @param {string} filePath - File path
 * @param {string} content - File content
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content);
    logger.debug(`Wrote to file: ${filePath}`);
  } catch (err) {
    logger.error(`Error writing to file: ${err.message}`);
    throw err;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - File path
 * @returns {Promise<boolean>} - True if file exists, false otherwise
 */
async function fileExists(filePath) {
  try {
    return await fs.pathExists(filePath);
  } catch (err) {
    logger.error(`Error checking if file exists: ${err.message}`);
    throw err;
  }
}

/**
 * Remove a file or directory
 * @param {string} filePath - File or directory path
 * @returns {Promise<void>}
 */
async function remove(filePath) {
  try {
    await fs.remove(filePath);
    logger.debug(`Removed file or directory: ${filePath}`);
  } catch (err) {
    logger.error(`Error removing file or directory: ${err.message}`);
    throw err;
  }
}

module.exports = {
  ensureDirectory,
  copyDirectory,
  readFile,
  writeFile,
  fileExists,
  remove,
  joinPath
};
