const { logger } = require('../utils/logger');
const { run, get, all } = require('../database');
const dockerComposeService = require('./dockerComposeService');
const tailscaleService = require('./tailscaleService');
const {
  createEnvironmentId,
  getEnvironmentDir,
  createEnvironmentUrl
} = require('../utils/environmentConfig');

/**
 * Create a new PR environment
 * @param {string} repositoryName - Repository name
 * @param {number} prNumber - PR number
 * @param {Array} services - Array of services with name and image_url
 * @returns {Promise<Object>} - Environment details
 */
async function createEnvironment(repositoryName, prNumber, services) {
  try {
    // Create environment ID using repository name
    const environmentId = createEnvironmentId(repositoryName, prNumber);

    // Check if environment already exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (existingEnv) {
      return updateEnvironment(repositoryName, prNumber, services);
    }

    // Set up PR environment with vertuoza-compose
    const environmentDir = await dockerComposeService.setupPrEnvironment(repositoryName, prNumber, services);

    // Start the environment
    await dockerComposeService.startEnvironment(environmentDir);

    // Create the URL for the PR environment
    const url = createEnvironmentUrl(environmentId);

    // Store environment in database
    const servicesData = JSON.stringify(services);

    await run(
      'INSERT INTO environments (id, repository_name, services_data, pr_number, status, url) VALUES (?, ?, ?, ?, ?, ?)',
      [environmentId, repositoryName, servicesData, prNumber, 'running', url]
    );

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'create', 'success', `Environment created successfully with ${services.length} services`]
    );

    return {
      id: environmentId,
      repositoryName,
      services: services.map(s => ({
        name: s.name,
        imageUrl: s.image_url
      })),
      prNumber,
      status: 'running',
      url
    };
  } catch (err) {
    logger.error(`Error creating environment: ${err.message}`);

    try {
      // Check if environment exists before logging to database
      const environmentId = createEnvironmentId(repositoryName, prNumber);
      const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

      if (existingEnv) {
        // Environment exists, safe to log to database
        await run(
          'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
          [environmentId, 'create', 'error', err.message]
        );
      } else {
        // Environment doesn't exist, create a placeholder record first
        const servicesData = JSON.stringify(services || []);
        const url = createEnvironmentUrl(environmentId);

        // Create a placeholder environment record with error status
        await run(
          'INSERT INTO environments (id, repository_name, services_data, pr_number, status, url) VALUES (?, ?, ?, ?, ?, ?)',
          [environmentId, repositoryName, servicesData, prNumber, 'error', url]
        );

        // Now safe to log to database
        await run(
          'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
          [environmentId, 'create', 'error', err.message]
        );
      }
    } catch (logErr) {
      // If logging to database fails, just log to console
      logger.error(`Failed to log error to database: ${logErr.message}`);
    }

    throw err;
  }
}

/**
 * Update an existing PR environment
 * @param {string} repositoryName - Repository name
 * @param {number} prNumber - PR number
 * @param {Array} services - Array of services with name and image_url
 * @returns {Promise<Object>} - Environment details
 */
async function updateEnvironment(repositoryName, prNumber, services) {
  try {
    // Create environment ID using repository name
    const environmentId = createEnvironmentId(repositoryName, prNumber);

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      return createEnvironment(repositoryName, prNumber, services);
    }

    // Set up PR environment with vertuoza-compose
    const environmentDir = await dockerComposeService.setupPrEnvironment(repositoryName, prNumber, services);

    // Update the environment
    await dockerComposeService.startEnvironment(environmentDir);

    // Create the URL for the PR environment
    const url = createEnvironmentUrl(environmentId);

    const servicesData = JSON.stringify(services);

    // Update environment in database
    await run(
      'UPDATE environments SET repository_name = ?, services_data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [repositoryName, servicesData, 'running', environmentId]
    );

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'update', 'success', `Environment updated successfully with ${services.length} services`]
    );

    return {
      id: environmentId,
      repositoryName,
      services: services.map(s => ({
        name: s.name,
        imageUrl: s.image_url
      })),
      prNumber,
      status: 'running',
      url
    };
  } catch (err) {
    logger.error(`Error updating environment: ${err.message}`);

    try {
      // Check if environment exists before logging to database
      const environmentId = createEnvironmentId(repositoryName, prNumber);
      const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

      if (existingEnv) {
        // Environment exists, safe to log to database
        await run(
          'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
          [environmentId, 'update', 'error', err.message]
        );
      } else {
        // Environment doesn't exist, create a placeholder record first
        const servicesData = JSON.stringify(services || []);
        const url = createEnvironmentUrl(environmentId);

        // Create a placeholder environment record with error status
        await run(
          'INSERT INTO environments (id, repository_name, services_data, pr_number, status, url) VALUES (?, ?, ?, ?, ?, ?)',
          [environmentId, repositoryName, servicesData, prNumber, 'error', url]
        );

        // Now safe to log to database
        await run(
          'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
          [environmentId, 'update', 'error', err.message]
        );
      }
    } catch (logErr) {
      // If logging to database fails, just log to console
      logger.error(`Failed to log error to database: ${logErr.message}`);
    }

    throw err;
  }
}

/**
 * Remove a PR environment
 * @param {string} repositoryName - Repository name
 * @param {number} prNumber - PR number
 * @returns {Promise<Object>} - Result
 */
async function removeEnvironment(repositoryName, prNumber) {
  try {
    // Create environment ID using repository name
    const environmentId = createEnvironmentId(repositoryName, prNumber);

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    // Get the environment directory
    const environmentDir = getEnvironmentDir(environmentId);

    // Stop and remove the environment
    await dockerComposeService.stopEnvironment(environmentDir);

    // Remove the Tailscale machine
    await tailscaleService.removeTailscaleMachine(environmentId);

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
    await dockerComposeService.cleanupEnvironment(environmentDir);

    return {
      id: environmentId,
      repositoryName,
      status: 'removed',
      message: 'Environment removed successfully'
    };
  } catch (err) {
    logger.error(`Error removing environment: ${err.message}`);

    try {
      // Check if environment exists before logging to database
      const environmentId = createEnvironmentId(repositoryName, prNumber);
      const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

      if (existingEnv) {
        // Environment exists, safe to log to database
        await run(
          'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
          [environmentId, 'remove', 'error', err.message]
        );
      } else {
        // If we're trying to remove a non-existent environment, just log to console
        logger.warn(`Cannot log removal error for non-existent environment: ${environmentId}`);
      }
    } catch (logErr) {
      // If logging to database fails, just log to console
      logger.error(`Failed to log error to database: ${logErr.message}`);
    }

    throw err;
  }
}

/**
 * Get environment details
 * @param {string} environmentId - Environment ID
 * @returns {Promise<Object>} - Environment details
 */
async function getEnvironment(environmentId) {
  try {
    const environment = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!environment) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    // Parse services data if available
    let services = [];
    if (environment.services_data) {
      try {
        services = JSON.parse(environment.services_data);
      } catch (parseErr) {
        logger.warn(`Error parsing services data for environment ${environmentId}: ${parseErr.message}`);
      }
    }

    return {
      id: environment.id,
      repositoryName: environment.repository_name,
      services: services.map(s => ({
        name: s.name,
        imageUrl: s.image_url
      })),
      prNumber: environment.pr_number,
      status: environment.status,
      url: environment.url,
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
 * @returns {Promise<Array>} - List of environments
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

      if (filters.prNumber) {
        if (params.length > 0) query += ' AND';
        query += ' pr_number = ?';
        params.push(filters.prNumber);
      }

      if (filters.repositoryName) {
        if (params.length > 0) query += ' AND';
        query += ' repository_name = ?';
        params.push(filters.repositoryName);
      }
    }

    // Order by creation date
    query += ' ORDER BY created_at DESC';

    const environments = await all(query, params);

    return environments.map(env => {
      // Parse services data if available
      let services = [];
      if (env.services_data) {
        try {
          services = JSON.parse(env.services_data);
        } catch (parseErr) {
          logger.warn(`Error parsing services data for environment ${env.id}: ${parseErr.message}`);
        }
      }

      return {
        id: env.id,
        repositoryName: env.repository_name,
        services: services.map(s => ({
          name: s.name,
          imageUrl: s.image_url
        })),
        prNumber: env.pr_number,
        status: env.status,
        url: env.url,
        createdAt: env.created_at,
        updatedAt: env.updated_at
      };
    });
  } catch (err) {
    logger.error(`Error listing environments: ${err.message}`);
    throw err;
  }
}

/**
 * Get environment logs
 * @param {string} environmentId - Environment ID
 * @returns {Promise<Array>} - List of logs
 */
async function getEnvironmentLogs(environmentId) {
  try {
    const logs = await all(
      'SELECT * FROM environment_logs WHERE environment_id = ? ORDER BY created_at DESC',
      [environmentId]
    );

    return logs;
  } catch (err) {
    logger.error(`Error getting environment logs: ${err.message}`);
    throw err;
  }
}

module.exports = {
  createEnvironment,
  updateEnvironment,
  removeEnvironment,
  getEnvironment,
  listEnvironments,
  getEnvironmentLogs
};
