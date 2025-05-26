const { logger } = require('../utils/logger');
const { executeCommand } = require('../utils/commandExecutor');
const fileSystem = require('../utils/fileSystem');
const fs = require('fs').promises;
const path = require('path');
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
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<string>} - Path to the configured folder
 */
async function setupPrEnvironment(repositoryName, prNumber, services, environmentType = 'qa') {
  try {
    // Create environment ID using repository name
    const environmentId = await createEnvironmentId(repositoryName, prNumber, environmentType);

    // Create environment directory
    const environmentDir = getEnvironmentDir(environmentId);
    await fileSystem.ensureDirectory(environmentDir);

    // Path to the source vertuoza-compose folder
    const sourceDir = process.env.VERTUOZA_COMPOSE_DIR || fileSystem.joinPath(__dirname, '../../../vertuoza-compose');

    // Copy the entire vertuoza-compose folder contents directly to the environment directory
    await fileSystem.copyDirectory(sourceDir, environmentDir);

    // Update environment files with PR-specific configuration and multiple services
    await updateEnvironmentFiles(environmentDir, repositoryName, prNumber, services, environmentType);

    logger.info(`Set up PR environment at ${environmentDir} with ${services.length} services and environment type ${environmentType}`);

    return environmentDir;
  } catch (err) {
    logger.error(`Error setting up PR environment: ${err.message}`);
    throw err;
  }
}

/**
 * Configure Google Cloud Authentication for Docker
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<void>}
 */
async function configureGoogleCloudAuth(environmentType = 'qa') {
  try {
    // Check if Google Cloud credentials are provided
    let base64Credentials;

    if (environmentType === 'demo') {
      base64Credentials = process.env.GOOGLE_CLOUD_KEYFILE_DEMO;
    } else {
      base64Credentials = process.env.GOOGLE_CLOUD_KEYFILE_QA;
    }

    if (!base64Credentials) {
      logger.warn(`No Google Cloud credentials provided for ${environmentType} environment. Docker may not be able to pull images from Google Cloud Artifact Registry.`);
      return;
    }

    // Remove any quotes that might be in the string
    const cleanBase64 = base64Credentials.replace(/^"(.*)"$/, '$1');

    // Decode the base64 string to get the JSON content
    let credentialsJson;
    try {
      credentialsJson = Buffer.from(cleanBase64, 'base64').toString('utf-8');
      // Validate that it's valid JSON
      JSON.parse(credentialsJson);
    } catch (error) {
      logger.error(`Error decoding base64 credentials: ${error.message}`);
      return;
    }

    // Write credentials JSON to a temporary file
    const tempCredentialsPath = path.join('/tmp', 'gcp-credentials.json');
    await fs.writeFile(tempCredentialsPath, credentialsJson);
    logger.info(`Wrote Google Cloud credentials to temporary file: ${tempCredentialsPath}`);

    // Configure Docker to authenticate with Google Cloud Artifact Registry
    await executeCommand(`gcloud auth activate-service-account --key-file=${tempCredentialsPath}`);
    await executeCommand('gcloud auth configure-docker europe-west1-docker.pkg.dev --quiet');

    logger.info(`Configured Docker authentication with Google Cloud Artifact Registry for ${environmentType} environment`);
  } catch (err) {
    logger.error(`Error configuring Google Cloud authentication: ${err.message}`);
    // Don't throw the error, just log it and continue
  }
}

/**
 * Configure GitHub Authentication for Docker
 * @returns {Promise<void>}
 */
async function configureGitHubAuth() {
  try {
    // Check if GitHub token is provided
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      logger.warn('No GitHub token provided. Docker may not be able to pull images from GitHub Container Registry.');
      return;
    }

    // Remove any quotes that might be in the string
    const cleanToken = githubToken.replace(/^"(.*)"$/, '$1');

    // Configure Docker to authenticate with GitHub Container Registry
    await executeCommand(`echo ${cleanToken} | docker login ghcr.io -u USERNAME --password-stdin`);
    logger.info('Configured Docker authentication with GitHub Container Registry');
  } catch (err) {
    logger.error(`Error configuring GitHub authentication: ${err.message}`);
    // Don't throw the error, just log it and continue
  }
}

/**
 * Start a Docker Compose environment
 * @param {string} environmentDir - Environment directory
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<void>}
 */
async function startEnvironment(environmentDir, environmentType = 'qa') {
  try {
    // Configure Google Cloud Authentication before starting the environment
    await configureGoogleCloudAuth(environmentType);

    // Configure GitHub Authentication before starting the environment
    await configureGitHubAuth();

    // Pull the latest images first
    await executeCommand(`cd ${environmentDir} && docker compose pull`);
    logger.info(`Pulled latest Docker images for environment at ${environmentDir}`);

    // Then start the environment
    await executeCommand(`cd ${environmentDir} && docker compose up -d`);
    logger.info(`Started Docker Compose environment at ${environmentDir} with ${environmentType} environment`);
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
    // Stop and remove containers, networks, and volumes for this environment
    await executeCommand(`cd ${environmentDir} && docker compose down -v --remove-orphans`);

    // Clean up only dangling images (conservative approach)
    await executeCommand('docker image prune -f');

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

/**
 * Get Docker Compose logs for an environment
 * @param {string} environmentId - Environment ID
 * @returns {Promise<string>} - Docker Compose logs
 */
async function getEnvironmentLogs(environmentId) {
  try {
    const environmentDir = getEnvironmentDir(environmentId);
    const logs = await executeCommand(`cd ${environmentDir} && docker compose logs`);
    return logs;
  } catch (err) {
    logger.error(`Error getting Docker Compose logs: ${err.message}`);
    throw err;
  }
}

module.exports = {
  setupPrEnvironment,
  startEnvironment,
  stopEnvironment,
  cleanupEnvironment,
  getEnvironmentLogs
};
