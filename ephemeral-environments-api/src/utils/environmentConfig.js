const yaml = require('yaml');
const { logger } = require('./logger');
const fileSystem = require('./fileSystem');
const { get } = require('../database');

// Environment directory
const environmentsDir = fileSystem.joinPath(__dirname, '../../data/environments');

// Tailscale domain
const tailscaleDomain = process.env.TAILSCALE_DOMAIN || 'tailf31c84.ts.net';

/**
 * Create environment ID from repository name and PR number or generate a demo ID
 * @param {string} repositoryName - Repository name (optional for demo)
 * @param {number} prNumber - PR number (optional for demo)
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<string>} - Environment ID
 */
async function createEnvironmentId(repositoryName, prNumber, environmentType = 'qa') {
  if (environmentType === 'demo') {
    // Get next available demo number
    const nextDemoNumber = await getNextDemoNumber();
    return `demo-${nextDemoNumber}`;
  } else {
    // Default QA behavior
    return `${repositoryName}-pr-${prNumber}`;
  }
}

/**
 * Get the next available demo number by querying existing environments
 * @returns {Promise<number>} - Next available demo number
 */
async function getNextDemoNumber() {
  // Query the environments table to find the highest demo number
  const query = "SELECT id FROM environments WHERE id LIKE 'demo-%' ORDER BY id DESC LIMIT 1";
  const latestDemo = await get(query);

  if (!latestDemo) {
    // No demo environments exist yet, start with 1
    return 1;
  }

  // Extract the number from the ID (format: 'demo-X')
  const currentNumber = parseInt(latestDemo.id.split('-')[1], 10);

  // Return the next number in sequence
  return currentNumber + 1;
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
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<void>}
 */
async function updateEnvironmentFiles(environmentDir, repositoryName, prNumber, services, environmentType = 'qa') {
  try {
    // Create environment ID (subdomain) using repository name
    const environmentId = await createEnvironmentId(repositoryName, prNumber, environmentType);

    // Update .env file if it exists
    const envPath = fileSystem.joinPath(environmentDir, '.env');
    if (await fileSystem.fileExists(envPath)) {
      let envContent = await fileSystem.readFile(envPath);

      // Replace all occurrences of tailscale-subdomain with the environment ID
      envContent = envContent.replace(/tailscale-subdomain/g, environmentId);

      // Add Google Cloud authentication if it exists in the parent environment
      if (environmentType === 'demo' && process.env.GOOGLE_CLOUD_KEYFILE_DEMO) {
        envContent += `\n# Google Cloud Authentication (DEMO)\nGOOGLE_CLOUD_KEYFILE_DEMO=${process.env.GOOGLE_CLOUD_KEYFILE_DEMO}\n`;
        logger.info('Added Google Cloud Keyfile for DEMO environment');
      } else if (process.env.GOOGLE_CLOUD_KEYFILE_QA) {
        envContent += `\n# Google Cloud Authentication (QA)\nGOOGLE_CLOUD_KEYFILE_QA=${process.env.GOOGLE_CLOUD_KEYFILE_QA}\n`;
        logger.info('Added Google Cloud Keyfile for QA environment');
      }

      // Add GitHub authentication if it exists in the parent environment
      if (process.env.GITHUB_TOKEN) {
        envContent += `\n# GitHub Authentication\nGITHUB_TOKEN=${process.env.GITHUB_TOKEN}\n`;
        logger.info('Added GitHub Token to environment');
      }

      // Write updated .env file
      await fileSystem.writeFile(envPath, envContent);
      logger.info(`Updated .env file at ${envPath} with subdomain ${environmentId} and environment type ${environmentType}`);
    }

    // Update docker-compose.yml
    const composePath = fileSystem.joinPath(environmentDir, 'docker-compose.yml');
    let composeContent = await fileSystem.readFile(composePath);

    // Replace all occurrences of tailscale-subdomain with the environment ID
    composeContent = composeContent.replace(/tailscale-subdomain/g, environmentId);

    // Replace all occurrences of vertuoza-qa with vertuoza-demo-382712 if environment type is demo
    if (environmentType === 'demo') {
      composeContent = composeContent.replace(/vertuoza-qa/g, 'vertuoza-demo-382712');
      logger.info('Replaced all occurrences of vertuoza-qa with vertuoza-demo-382712 in docker-compose.yml');
    }

    // Parse the content to YAML
    const compose = yaml.parse(composeContent);

    // Get the appropriate GCP project ID based on environment type
    const gcpProjectId = environmentType === 'demo' ? 'vertuoza-demo-382712' : 'vertuoza-qa';

    // Update multiple services in the compose file
    for (const service of services) {
      if (compose.services && compose.services[service.name]) {
        compose.services[service.name].image = service.image_url;
        logger.info(`Updated service ${service.name} with image ${service.image_url}`);
      } else {
        logger.warn(`Service ${service.name} not found in docker-compose.yml`);
      }
    }

    // Update all services that use the GCP registry to use the correct project
    for (const serviceName in compose.services) {
      const service = compose.services[serviceName];
      if (service.image && service.image.includes('europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/')) {
        // Replace the project ID in the image URL
        service.image = service.image.replace(
          'europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/',
          `europe-west1-docker.pkg.dev/${gcpProjectId}/vertuoza/`
        );
        logger.info(`Updated service ${serviceName} to use ${gcpProjectId} project`);
      }
    }

    // Write updated docker-compose.yml
    await fileSystem.writeFile(composePath, yaml.stringify(compose));
    logger.info(`Updated docker-compose.yml at ${composePath} with subdomain ${environmentId}, ${services.length} services, and environment type ${environmentType}`);
  } catch (err) {
    logger.error(`Error updating environment files: ${err.message}`);
    throw err;
  }
}

module.exports = {
  environmentsDir,
  tailscaleDomain,
  createEnvironmentId,
  getNextDemoNumber,
  getEnvironmentDir,
  createEnvironmentUrl,
  updateEnvironmentFiles
};
