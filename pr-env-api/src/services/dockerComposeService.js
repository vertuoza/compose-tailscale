const { logger } = require('../utils/logger');
const { executeCommand } = require('../utils/commandExecutor');
const fileSystem = require('../utils/fileSystem');
const {
  createEnvironmentId,
  getEnvironmentDir,
  updateEnvironmentFiles
} = require('../utils/environmentConfig');

/**
 * Copy and configure vertuoza-compose folder for PR environment
 * @param {string} repositoryName - Repository name
 * @param {number} prNumber - PR number
 * @param {Array} services - Array of services with name and image_url
 * @returns {Promise<string>} - Path to the configured folder
 */
async function setupPrEnvironment(repositoryName, prNumber, services) {
  try {
    // Create environment ID using repository name
    const environmentId = createEnvironmentId(repositoryName, prNumber);

    // Create environment directory
    const environmentDir = getEnvironmentDir(environmentId);
    await fileSystem.ensureDirectory(environmentDir);

    // Path to the source vertuoza-compose folder
    const sourceDir = fileSystem.joinPath(__dirname, '../../../vertuoza-compose');

    // Copy the entire vertuoza-compose folder contents directly to the environment directory
    await fileSystem.copyDirectory(sourceDir, environmentDir);

    // Update environment files with PR-specific configuration and multiple services
    await updateEnvironmentFiles(environmentDir, repositoryName, prNumber, services);

    logger.info(`Set up PR environment at ${environmentDir} with ${services.length} services`);

    return environmentDir;
  } catch (err) {
    logger.error(`Error setting up PR environment: ${err.message}`);
    throw err;
  }
}

/**
 * Start a Docker Compose environment
 * @param {string} environmentDir - Environment directory
 * @returns {Promise<void>}
 */
async function startEnvironment(environmentDir) {
  try {
    await executeCommand(`cd ${environmentDir} && docker compose up -d`);
    logger.info(`Started Docker Compose environment at ${environmentDir}`);
  } catch (err) {
    logger.error(`Error starting Docker Compose environment: ${err.message}`);
    throw err;
  }
}

/**
 * Stop and remove a Docker Compose environment
 * @param {string} environmentDir - Environment directory
 * @returns {Promise<void>}
 */
async function stopEnvironment(environmentDir) {
  try {
    await executeCommand(`cd ${environmentDir} && docker compose down -v --remove-orphans`);

    // Clean up any dangling containers, images, and volumes
    await executeCommand('docker system prune -f');

    logger.info(`Stopped Docker Compose environment at ${environmentDir}`);
  } catch (err) {
    logger.error(`Error stopping Docker Compose environment: ${err.message}`);
    throw err;
  }
}

/**
 * Clean up environment directory
 * @param {string} environmentDir - Environment directory
 * @returns {Promise<void>}
 */
async function cleanupEnvironment(environmentDir) {
  try {
    await fileSystem.remove(environmentDir);
    logger.info(`Cleaned up environment directory at ${environmentDir}`);
  } catch (err) {
    logger.error(`Error cleaning up environment directory: ${err.message}`);
    throw err;
  }
}

module.exports = {
  setupPrEnvironment,
  startEnvironment,
  stopEnvironment,
  cleanupEnvironment
};
