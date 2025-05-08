const yaml = require('yaml');
const { logger } = require('./logger');
const fileSystem = require('./fileSystem');

// Environment directory
const environmentsDir = fileSystem.joinPath(__dirname, '../../data/environments');

// Tailscale domain
const tailscaleDomain = process.env.TAILSCALE_DOMAIN || 'tailf31c84.ts.net';

/**
 * Create environment ID from service name and PR number
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @returns {string} - Environment ID
 */
function createEnvironmentId(serviceName, prNumber) {
  return `${serviceName}-pr-${prNumber}`;
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
 * @param {string} environmentDir - Environment directory
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @returns {Promise<void>}
 */
async function updateEnvironmentFiles(environmentDir, serviceName, prNumber, imageUrl) {
  try {
    // Create environment ID (subdomain)
    const environmentId = createEnvironmentId(serviceName, prNumber);

    // Update .env file if it exists
    const envPath = fileSystem.joinPath(environmentDir, '.env');
    if (await fileSystem.fileExists(envPath)) {
      let envContent = await fileSystem.readFile(envPath);

      // Replace all occurrences of tailscale-subdomain with the environment ID
      envContent = envContent.replace(/tailscale-subdomain/g, environmentId);

      // Write updated .env file
      await fileSystem.writeFile(envPath, envContent);
      logger.info(`Updated .env file at ${envPath} with subdomain ${environmentId}`);
    }

    // Update docker-compose.yml
    const composePath = fileSystem.joinPath(environmentDir, 'docker-compose.yml');
    let composeContent = await fileSystem.readFile(composePath);

    // Replace all occurrences of tailscale-subdomain with the environment ID
    composeContent = composeContent.replace(/tailscale-subdomain/g, environmentId);

    // Parse the updated content to YAML
    const compose = yaml.parse(composeContent);

    // Update the service image if it exists in the compose file
    if (compose.services && compose.services[serviceName]) {
      compose.services[serviceName].image = imageUrl;
    }

    // Write updated docker-compose.yml
    await fileSystem.writeFile(composePath, yaml.stringify(compose));
    logger.info(`Updated docker-compose.yml at ${composePath} with subdomain ${environmentId}`);
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
