const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { logger } = require('../utils/logger');
const { run, get } = require('../database');

// Environment directory
const environmentsDir = process.env.ENVIRONMENTS_DIR || path.join(__dirname, '../../data/environments');

// Base docker-compose.yml path
const baseComposeFile = process.env.BASE_COMPOSE_FILE || path.join(__dirname, '../../../docker-compose.yml');

// Docker Compose executable path
const dockerComposePath = process.env.DOCKER_COMPOSE_PATH || 'docker-compose';

// Tailscale domain
const tailscaleDomain = process.env.TAILSCALE_DOMAIN || 'tailf31c84.ts.net';

// Tailscale config path
const tailscaleConfigPath = process.env.TAILSCALE_CONFIG_PATH || path.join(__dirname, '../../../config/vertuoza-platform.json');

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
 * Generate a docker-compose.override.yml file for a PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @param {Object} config - Additional configuration
 * @returns {string} - Path to the generated file
 */
async function generateComposeOverride(serviceName, prNumber, imageUrl, config = {}) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Create environment directory
    const environmentDir = path.join(environmentsDir, environmentId);
    await fs.ensureDir(environmentDir);

    // Read the base docker-compose.yml
    const baseComposeContent = await fs.readFile(baseComposeFile, 'utf8');
    const baseCompose = yaml.parse(baseComposeContent);

    // Create override for the specific service
    const override = {
      version: baseCompose.version || '3',
      services: {
        [serviceName]: {
          image: imageUrl,
          environment: [
            `PR_NUMBER=${prNumber}`,
            `REPOSITORY_NAME=${serviceName}`
          ]
        }
      }
    };

    // Add any additional environment variables from config
    if (config.environment) {
      override.services[serviceName].environment = [
        ...override.services[serviceName].environment,
        ...config.environment
      ];
    }

    // Write the override file
    const overridePath = path.join(environmentDir, 'docker-compose.override.yml');
    await fs.writeFile(overridePath, yaml.stringify(override));

    // Update Tailscale configuration
    await updateTailscaleConfig(serviceName, prNumber);

    return overridePath;
  } catch (err) {
    logger.error(`Error generating compose override: ${err.message}`);
    throw err;
  }
}

/**
 * Update Tailscale configuration to include the PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 */
async function updateTailscaleConfig(serviceName, prNumber) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Read the current Tailscale config
    const tailscaleConfigContent = await fs.readFile(tailscaleConfigPath, 'utf8');
    const tailscaleConfig = JSON.parse(tailscaleConfigContent);

    // Create the URL for the PR environment
    const prUrl = `${environmentId}.${tailscaleDomain}`;

    // Add the PR environment to the Tailscale config
    if (!tailscaleConfig.Web) {
      tailscaleConfig.Web = {};
    }

    // Add the PR environment to the Web section
    tailscaleConfig.Web[`${prUrl}:443`] = {
      Handlers: {
        "/": {
          Proxy: `http://${serviceName}`
        }
      }
    };

    // Add AllowFunnel entry
    if (!tailscaleConfig.AllowFunnel) {
      tailscaleConfig.AllowFunnel = {};
    }

    tailscaleConfig.AllowFunnel[`${prUrl}:443`] = false;

    // Write the updated config
    await fs.writeFile(tailscaleConfigPath, JSON.stringify(tailscaleConfig, null, 2));

    // Restart Tailscale to apply the changes
    await executeCommand('docker restart vertuoza-platform-ts');

    logger.info(`Updated Tailscale config for ${prUrl}`);
  } catch (err) {
    logger.error(`Error updating Tailscale config: ${err.message}`);
    throw err;
  }
}

/**
 * Remove PR environment from Tailscale configuration
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 */
async function removeTailscaleConfig(serviceName, prNumber) {
  try {
    // Create environment ID
    const environmentId = `${serviceName}-pr-${prNumber}`;

    // Read the current Tailscale config
    const tailscaleConfigContent = await fs.readFile(tailscaleConfigPath, 'utf8');
    const tailscaleConfig = JSON.parse(tailscaleConfigContent);

    // Create the URL for the PR environment
    const prUrl = `${environmentId}.${tailscaleDomain}`;

    // Remove the PR environment from the Web section
    if (tailscaleConfig.Web && tailscaleConfig.Web[`${prUrl}:443`]) {
      delete tailscaleConfig.Web[`${prUrl}:443`];
    }

    // Remove AllowFunnel entry
    if (tailscaleConfig.AllowFunnel && tailscaleConfig.AllowFunnel[`${prUrl}:443`]) {
      delete tailscaleConfig.AllowFunnel[`${prUrl}:443`];
    }

    // Write the updated config
    await fs.writeFile(tailscaleConfigPath, JSON.stringify(tailscaleConfig, null, 2));

    // Restart Tailscale to apply the changes
    await executeCommand('docker restart vertuoza-platform-ts');

    logger.info(`Removed ${prUrl} from Tailscale config`);
  } catch (err) {
    logger.error(`Error removing Tailscale config: ${err.message}`);
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

    // Generate docker-compose.override.yml
    const overridePath = await generateComposeOverride(serviceName, prNumber, imageUrl, config);

    // Get the directory containing the override file
    const environmentDir = path.dirname(overridePath);

    // Start the environment
    await executeCommand(`cd ${environmentDir} && ${dockerComposePath} -f ${baseComposeFile} -f ${overridePath} up -d`);

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

    // Generate docker-compose.override.yml
    const overridePath = await generateComposeOverride(serviceName, prNumber, imageUrl, config);

    // Get the directory containing the override file
    const environmentDir = path.dirname(overridePath);

    // Update the environment
    await executeCommand(`cd ${environmentDir} && ${dockerComposePath} -f ${baseComposeFile} -f ${overridePath} up -d`);

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

    // Get the override file path
    const overridePath = path.join(environmentDir, 'docker-compose.override.yml');

  // Stop and remove the environment with volumes and orphans
  await executeCommand(`cd ${environmentDir} && ${dockerComposePath} -f ${baseComposeFile} -f ${overridePath} down -v --remove-orphans`);

  // Clean up any dangling containers, images, and volumes
  await executeCommand('docker system prune -f');

    // Remove Tailscale configuration
    await removeTailscaleConfig(serviceName, prNumber);

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
