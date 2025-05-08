const { logger } = require('../utils/logger');
const { run, get, all } = require('../database');
const dockerComposeService = require('./dockerComposeService');
const {
  createEnvironmentId,
  getEnvironmentDir,
  createEnvironmentUrl
} = require('../utils/environmentConfig');

/**
 * Create a new PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @returns {Promise<Object>} - Environment details
 */
async function createEnvironment(serviceName, prNumber, imageUrl) {
  try {
    // Create environment ID
    const environmentId = createEnvironmentId(serviceName, prNumber);

    // Check if environment already exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (existingEnv) {
      return updateEnvironment(serviceName, prNumber, imageUrl);
    }

    // Set up PR environment with vertuoza-compose
    const environmentDir = await dockerComposeService.setupPrEnvironment(serviceName, prNumber, imageUrl);

    // Start the environment
    await dockerComposeService.startEnvironment(environmentDir);

    // Create the URL for the PR environment
    const url = createEnvironmentUrl(environmentId);

    // Store environment in database
    await run(
      'INSERT INTO environments (id, service_name, pr_number, status, url, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [environmentId, serviceName, prNumber, 'running', url, imageUrl]
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
      imageUrl
    };
  } catch (err) {
    logger.error(`Error creating environment: ${err.message}`);

    // Log the error
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [createEnvironmentId(serviceName, prNumber), 'create', 'error', err.message]
    );

    throw err;
  }
}

/**
 * Update an existing PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @param {string} imageUrl - Docker image URL
 * @returns {Promise<Object>} - Environment details
 */
async function updateEnvironment(serviceName, prNumber, imageUrl) {
  try {
    // Create environment ID
    const environmentId = createEnvironmentId(serviceName, prNumber);

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      return createEnvironment(serviceName, prNumber, imageUrl);
    }

    // Set up PR environment with vertuoza-compose
    const environmentDir = await dockerComposeService.setupPrEnvironment(serviceName, prNumber, imageUrl);

    // Update the environment
    await dockerComposeService.startEnvironment(environmentDir);

    // Create the URL for the PR environment
    const url = createEnvironmentUrl(environmentId);

    // Update environment in database
    await run(
      'UPDATE environments SET status = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['running', imageUrl, environmentId]
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
      imageUrl
    };
  } catch (err) {
    logger.error(`Error updating environment: ${err.message}`);

    // Log the error
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [createEnvironmentId(serviceName, prNumber), 'update', 'error', err.message]
    );

    throw err;
  }
}

/**
 * Remove a PR environment
 * @param {string} serviceName - Service name
 * @param {number} prNumber - PR number
 * @returns {Promise<Object>} - Result
 */
async function removeEnvironment(serviceName, prNumber) {
  try {
    // Create environment ID
    const environmentId = createEnvironmentId(serviceName, prNumber);

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    // Get the environment directory
    const environmentDir = getEnvironmentDir(environmentId);

    // Stop and remove the environment
    await dockerComposeService.stopEnvironment(environmentDir);

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
      status: 'removed',
      message: 'Environment removed successfully'
    };
  } catch (err) {
    logger.error(`Error removing environment: ${err.message}`);

    // Log the error
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [createEnvironmentId(serviceName, prNumber), 'remove', 'error', err.message]
    );

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

    return {
      id: environment.id,
      serviceName: environment.service_name,
      prNumber: environment.pr_number,
      status: environment.status,
      url: environment.url,
      imageUrl: environment.image_url,
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
      createdAt: env.created_at,
      updatedAt: env.updated_at
    }));
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
