const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { logger } = require('../utils/logger');
const { run, get, all } = require('../database');

// Environment directory
const environmentsDir = path.join(__dirname, '../../data/environments');

// Tailscale domain
const tailscaleDomain = process.env.TAILSCALE_DOMAIN || 'tailf31c84.ts.net';

/**
 * Execute a shell command and return a promise
 * @param {string} command - Command to execute
 * @returns {Promise<string>} - Command output
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    logger.info(`Executing command: ${command}`);
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Command execution error: ${error.message}`);
        logger.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }

      if (stderr) {
        logger.warn(`Command stderr: ${stderr}`);
      }

      logger.debug(`Command stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

/**
 * Copy and configure vertuoza-compose folder for PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @param {Object} config - Additional configuration
 * @returns {string} - Path to the configured folder
 */
async function setupPrEnvironment(serviceName, prNumber, imageUrl, config = {}) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Create environment directory
    const environmentDir = path.join(environmentsDir, environmentId);
    await fs.ensureDir(environmentDir);

    // Path to the source vertuoza-compose folder
    const sourceDir = path.join(__dirname, '../../../vertuoza-compose');

    // Copy the entire vertuoza-compose folder contents directly to the environment directory
    await fs.copy(sourceDir, environmentDir);

    // Update the .env file with PR-specific configuration
    await updateEnvFile(environmentDir, serviceName, prNumber, imageUrl, config);

    // Update docker-compose.yml if needed (e.g., to use the specific image)
    await updateDockerComposeFile(environmentDir, serviceName, prNumber, imageUrl);

    logger.info(`Set up PR environment at ${environmentDir}`);

    return environmentDir;
  } catch (err) {
    logger.error(`Error setting up PR environment: ${err.message}`);
    throw err;
  }
}

/**
 * Update .env file for PR environment
 * @param {string} environmentDir - Environment directory
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @param {Object} config - Additional configuration
 */
async function updateEnvFile(environmentDir, serviceName, prNumber, imageUrl, config = {}) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Base URL for the environment
    const baseUrl = `https://${environmentId}.${tailscaleDomain}`;

    // Path to the .env file
    const envPath = path.join(environmentDir, '.env');

    // Read existing .env file if it exists
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (err) {
      // File doesn't exist, create a new one
      logger.info(`Creating new .env file at ${envPath}`);
    }

    // Parse existing environment variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    });

    // Update environment variables
    Object.assign(envVars, {
      APP_URL: baseUrl,
      FRONT_URL: `${baseUrl}/front`,
      GATEWAY_URL: `${baseUrl}/gateway`,
      KERNEL_URL: `${baseUrl}/kernel`,
      VERTUO_IDENTITY_URL: `${baseUrl}/identity`,
      VERTUO_AUTH_URL: `${baseUrl}/auth`,
      VERTUO_WORK_URL: `${baseUrl}/work`,
      PDF_BUILDER_URL: `${baseUrl}/pdf-builder`,
      VERTUO_AI_URL: `${baseUrl}/ai`,
      CLIENT_SPACE_URL: `${baseUrl}/client-space`,
      // Add service-specific variables
      [`${serviceName.toUpperCase()}_VERSION`]: 'latest',
      // Add any additional environment variables from config
      ...(config.environment ? config.environment.reduce((acc, env) => {
        const match = env.match(/^([^=]+)=(.*)$/);
        if (match) {
          acc[match[1]] = match[2];
        }
        return acc;
      }, {}) : {})
    });

    // Convert back to .env format
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Write updated .env file
    await fs.writeFile(envPath, newEnvContent);

    logger.info(`Updated .env file at ${envPath}`);
  } catch (err) {
    logger.error(`Error updating .env file: ${err.message}`);
    throw err;
  }
}

/**
 * Update docker-compose.yml for PR environment
 * @param {string} environmentDir - Environment directory
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 */
async function updateDockerComposeFile(environmentDir, serviceName, prNumber, imageUrl) {
  try {
    // Path to the docker-compose.yml file
    const composePath = path.join(environmentDir, 'docker-compose.yml');

    // Read docker-compose.yml
    const composeContent = await fs.readFile(composePath, 'utf8');
    const compose = yaml.parse(composeContent);

    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Create a new network name based on the environment ID
    const networkName = `${environmentId}-network`;

    // Update the service image if it exists in the compose file
    if (compose.services && compose.services[serviceName]) {
      compose.services[serviceName].image = imageUrl;
    }

    // Update all services to use the new network
    if (compose.services) {
      Object.keys(compose.services).forEach(service => {
        if (compose.services[service].networks) {
          // Replace all occurrences of vertuoza-network with the new network
          if (Array.isArray(compose.services[service].networks)) {
            compose.services[service].networks = compose.services[service].networks.map(
              network => network === 'vertuoza-network' ? networkName : network
            );
          } else {
            // Handle object notation for networks
            const networks = {};
            Object.keys(compose.services[service].networks).forEach(network => {
              if (network === 'vertuoza-network') {
                networks[networkName] = compose.services[service].networks[network] || {};
              } else {
                networks[network] = compose.services[service].networks[network];
              }
            });
            compose.services[service].networks = networks;
          }
        } else {
          // If no networks defined, add the new network
          compose.services[service].networks = [networkName];
        }
      });
    }

    // Update the networks section
    compose.networks = compose.networks || {};

    // Remove the vertuoza-network reference
    delete compose.networks['vertuoza-network'];

    // Add the new network
    compose.networks[networkName] = {
      name: networkName,
      attachable: true
    };

    // Write updated docker-compose.yml
    await fs.writeFile(composePath, yaml.stringify(compose));

    logger.info(`Updated docker-compose.yml at ${composePath} with network ${networkName}`);
  } catch (err) {
    logger.error(`Error updating docker-compose.yml: ${err.message}`);
    throw err;
  }
}

/**
 * Create a new PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @param {Object} config - Additional configuration
 * @returns {Object} - Environment details
 */
async function createEnvironment(serviceName, prNumber, imageUrl, config = {}) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Check if environment already exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (existingEnv) {
      return updateEnvironment(serviceName, prNumber, imageUrl, config);
    }

    // Set up PR environment with vertuoza-compose
    const environmentDir = await setupPrEnvironment(serviceName, prNumber, imageUrl, config);

    // Start the environment
    await executeCommand(`cd ${environmentDir} && docker compose up -d`);

    // Create the URL for the PR environment
    const url = `https://${environmentId}.${tailscaleDomain}`;

    // Store environment in database
    await run(
      'INSERT INTO environments (id, service_name, pr_number, status, url, image_url, config) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [environmentId, serviceName, prNumber, 'running', url, imageUrl, JSON.stringify(config)]
    );

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'create', 'success', 'Environment created successfully']
    );

    return {
      id: environmentId,
      serviceName,
      prNumber,
      status: 'running',
      url,
      imageUrl,
      config
    };
  } catch (err) {
    logger.error(`Error creating environment: ${err.message}`);

    // Log the error
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [`${serviceName}-pr-${prNumber}`, 'create', 'error', err.message]
    );

    throw err;
  }
}

/**
 * Update an existing PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @param {Object} config - Additional configuration
 * @returns {Object} - Environment details
 */
async function updateEnvironment(serviceName, prNumber, imageUrl, config = {}) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      return createEnvironment(serviceName, prNumber, imageUrl, config);
    }

    // Set up PR environment with vertuoza-compose
    const environmentDir = await setupPrEnvironment(serviceName, prNumber, imageUrl, config);

    // Update the environment
    await executeCommand(`cd ${environmentDir} && docker compose up -d`);

    // Create the URL for the PR environment
    const url = `https://${environmentId}.${tailscaleDomain}`;

    // Update environment in database
    await run(
      'UPDATE environments SET status = ?, image_url = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['running', imageUrl, JSON.stringify(config), environmentId]
    );

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'update', 'success', 'Environment updated successfully']
    );

    return {
      id: environmentId,
      serviceName,
      prNumber,
      status: 'running',
      url,
      imageUrl,
      config
    };
  } catch (err) {
    logger.error(`Error updating environment: ${err.message}`);

    // Log the error
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [`${serviceName}-pr-${prNumber}`, 'update', 'error', err.message]
    );

    throw err;
  }
}

/**
 * Remove a PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @returns {Object} - Result
 */
async function removeEnvironment(serviceName, prNumber) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    // Get the environment directory
    const environmentDir = path.join(environmentsDir, environmentId);

    // Stop and remove the environment with volumes and orphans
    await executeCommand(`cd ${environmentDir} && docker compose down -v --remove-orphans`);

    // Clean up any dangling containers, images, and volumes
    await executeCommand('docker system prune -f');

    // Update environment status in database
    await run(
      'UPDATE environments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['removed', environmentId]
    );

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'remove', 'success', 'Environment removed successfully']
    );

    // Clean up environment directory
    await fs.remove(environmentDir);

    return {
      id: environmentId,
      status: 'removed',
      message: 'Environment removed successfully'
    };
  } catch (err) {
    logger.error(`Error removing environment: ${err.message}`);

    // Log the error
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [`${serviceName}-pr-${prNumber}`, 'remove', 'error', err.message]
    );

    throw err;
  }
}

/**
 * Get environment details
 * @param {string} environmentId - Environment ID
 * @returns {Object} - Environment details
 */
async function getEnvironment(environmentId) {
  try {
    const environment = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!environment) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    return {
      id: environment.id,
      serviceName: environment.service_name,
      prNumber: environment.pr_number,
      status: environment.status,
      url: environment.url,
      imageUrl: environment.image_url,
      config: JSON.parse(environment.config || '{}'),
      createdAt: environment.created_at,
      updatedAt: environment.updated_at
    };
  } catch (err) {
    logger.error(`Error getting environment: ${err.message}`);
    throw err;
  }
}

/**
 * List all environments
 * @param {Object} filters - Filters
 * @returns {Array} - List of environments
 */
async function listEnvironments(filters = {}) {
  try {
    let query = 'SELECT * FROM environments';
    const params = [];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      query += ' WHERE';

      if (filters.status) {
        query += ' status = ?';
        params.push(filters.status);
      }

      if (filters.serviceName) {
        if (params.length > 0) query += ' AND';
        query += ' service_name = ?';
        params.push(filters.serviceName);
      }

      if (filters.prNumber) {
        if (params.length > 0) query += ' AND';
        query += ' pr_number = ?';
        params.push(filters.prNumber);
      }
    }

    // Order by creation date
    query += ' ORDER BY created_at DESC';

    const environments = await all(query, params);

    return environments.map(env => ({
      id: env.id,
      serviceName: env.service_name,
      prNumber: env.pr_number,
      status: env.status,
      url: env.url,
      imageUrl: env.image_url,
      config: JSON.parse(env.config || '{}'),
      createdAt: env.created_at,
      updatedAt: env.updated_at
    }));
  } catch (err) {
    logger.error(`Error listing environments: ${err.message}`);
    throw err;
  }
}

module.exports = {
  createEnvironment,
  updateEnvironment,
  removeEnvironment,
  getEnvironment,
  listEnvironments
};
