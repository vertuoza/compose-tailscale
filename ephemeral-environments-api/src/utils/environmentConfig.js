const yaml = require('yaml');
const { logger } = require('./logger');
const fileSystem = require('./fileSystem');

// Environment directory
const environmentsDir = fileSystem.joinPath(__dirname, '../../data/environments');

// Tailscale domain
const tailscaleDomain = process.env.TAILSCALE_DOMAIN || 'tailf31c84.ts.net';

/**
 * Create environment ID from repository name and PR number
 * @param {string} repositoryName - Repository name
 * @param {number} prNumber - PR number
 * @returns {string} - Environment ID
 */
function createEnvironmentId(repositoryName, prNumber) {
  return `${repositoryName}-pr-${prNumber}`;
}

/**
 * Get environment directory path
 * @param {string} environmentId - Environment ID
 * @returns {string} - Environment directory path
 */
function getEnvironmentDir(environmentId) {
  return fileSystem.joinPath(environmentsDir, environmentId);
}

/**
 * Create environment URL
 * @param {string} environmentId - Environment ID
 * @returns {string} - Environment URL
 */
function createEnvironmentUrl(environmentId) {
  return `https://${environmentId}.${tailscaleDomain}`;
}

/**
 * Update environment files by replacing tailscale-subdomain with the specific PR environment subdomain
 * and updating multiple services in the docker-compose file
 * @param {string} environmentDir - Environment directory
 * @param {string} repositoryName - Repository name
 * @param {number} prNumber - PR number
 * @param {Array} services - Array of services with name and image_url
 * @returns {Promise<void>}
 */
async function updateEnvironmentFiles(environmentDir, repositoryName, prNumber, services) {
  try {
    // Create environment ID (subdomain) using repository name
    const environmentId = createEnvironmentId(repositoryName, prNumber);

    // Update .env file if it exists
    const envPath = fileSystem.joinPath(environmentDir, '.env');
    if (await fileSystem.fileExists(envPath)) {
      let envContent = await fileSystem.readFile(envPath);

      // Replace all occurrences of tailscale-subdomain with the environment ID
      envContent = envContent.replace(/tailscale-subdomain/g, environmentId);

      // Add Google Cloud authentication if it exists in the parent environment
      if (process.env.GOOGLE_CLOUD_KEYFILE) {
        envContent += `\n# Google Cloud Authentication\nGOOGLE_CLOUD_KEYFILE=${process.env.GOOGLE_CLOUD_KEYFILE}\n`;
        logger.info('Added Google Cloud Keyfile to environment');
      }

      // Add GitHub authentication if it exists in the parent environment
      if (process.env.GITHUB_TOKEN) {
        envContent += `\n# GitHub Authentication\nGITHUB_TOKEN=${process.env.GITHUB_TOKEN}\n`;
        logger.info('Added GitHub Token to environment');
      }

      // Write updated .env file
      await fileSystem.writeFile(envPath, envContent);
      logger.info(`Updated .env file at ${envPath} with subdomain ${environmentId}`);
    }

    // Update docker-compose.yml
    const composePath = fileSystem.joinPath(environmentDir, 'docker-compose.yml');
    let composeContent = await fileSystem.readFile(composePath);

    // Replace all occurrences of tailscale-subdomain with the environment ID
    composeContent = composeContent.replace(/tailscale-subdomain/g, environmentId);

    // Parse the content to YAML
    const compose = yaml.parse(composeContent);

    // Update multiple services in the compose file
    for (const service of services) {
      if (compose.services && compose.services[service.name]) {
        compose.services[service.name].image = service.image_url;
        logger.info(`Updated service ${service.name} with image ${service.image_url}`);
      } else {
        logger.warn(`Service ${service.name} not found in docker-compose.yml`);
      }
    }

    // Write updated docker-compose.yml
    await fileSystem.writeFile(composePath, yaml.stringify(compose));
    logger.info(`Updated docker-compose.yml at ${composePath} with subdomain ${environmentId} and ${services.length} services`);
  } catch (err) {
    logger.error(`Error updating environment files: ${err.message}`);
    throw err;
  }
}

module.exports = {
  environmentsDir,
  tailscaleDomain,
  createEnvironmentId,
  getEnvironmentDir,
  createEnvironmentUrl,
  updateEnvironmentFiles
};
