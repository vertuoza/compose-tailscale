const { logger } = require('../utils/logger');
const { run, get, all } = require('../database');
const dockerComposeService = require('./dockerComposeService');
const tailscaleService = require('./tailscaleService');
const { setTimeout } = require('timers/promises');
const {
  createEnvironmentId,
  getEnvironmentDir,
  createEnvironmentUrl
} = require('../utils/environmentConfig');

/**
 * Create a new PR environment
 * @param {string} repositoryName - Repository name (optional for demo)
 * @param {number} prNumber - PR number (optional for demo)
 * @param {Array} services - Array of services with name and image_url
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<Object>} - Environment details
 */
async function createEnvironment(repositoryName, prNumber, services, environmentType = 'qa') {
  try {
    // Validate required fields based on environment type
    if (environmentType === 'qa') {
      if (!repositoryName) {
        throw new Error('repository_name is required for QA environments');
      }
      if (!prNumber) {
        throw new Error('pr_number is required for QA environments');
      }
    }

    // Create environment ID based on type
    const environmentId = await createEnvironmentId(repositoryName, prNumber, environmentType);

    // Check if environment already exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (existingEnv) {
      return updateEnvironment(repositoryName, prNumber, services);
    }

    // Set up environment with vertuoza-compose
    const environmentDir = await dockerComposeService.setupPrEnvironment(repositoryName, prNumber, services, environmentType);

    // Start the environment
    await dockerComposeService.startEnvironment(environmentDir, environmentType);

    // Create the URL for the PR environment
    const url = createEnvironmentUrl(environmentId);

    // Trigger certificate generation with a delay to ensure Tailscale is ready
    // This is done asynchronously so we don't block the environment creation
    setTimeout(10000) // 10 second delay
      .then(() => tailscaleService.triggerCertificateGeneration(url))
      .catch(err => logger.error(`Error in delayed certificate generation: ${err.message}`));

    // Store environment in database
    const servicesData = JSON.stringify(services);

    // Insert into database with appropriate values
    if (environmentType === 'demo') {
      await run(
        'INSERT INTO environments (id, services_data, status, url, environment_type) VALUES (?, ?, ?, ?, ?)',
        [environmentId, servicesData, 'running', url, environmentType]
      );
    } else {
      await run(
        'INSERT INTO environments (id, repository_name, services_data, pr_number, status, url, environment_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [environmentId, repositoryName, servicesData, prNumber, 'running', url, environmentType]
      );
    }

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'create', 'success', `Environment created successfully with ${services.length} services`]
    );

    // Return response with appropriate values
    const response = {
      id: environmentId,
      services: services.map(s => ({
        name: s.name,
        imageUrl: s.image_url
      })),
      status: 'running',
      url,
      environmentType
    };

    // Add repository_name and prNumber only for QA environments
    if (environmentType === 'qa') {
      response.repositoryName = repositoryName;
      response.prNumber = prNumber;
    }

    return response;
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
 * Update an existing environment
 * @param {string} repositoryName - Repository name (optional for demo)
 * @param {number} prNumber - PR number (optional for demo)
 * @param {Array} services - Array of services with name and image_url
 * @param {string} environmentType - Environment type (qa or demo)
 * @returns {Promise<Object>} - Environment details
 */
async function updateEnvironment(repositoryName, prNumber, services, environmentType = 'qa') {
  try {
    // Validate required fields based on environment type
    if (environmentType === 'qa') {
      if (!repositoryName) {
        throw new Error('repository_name is required for QA environments');
      }
      if (!prNumber) {
        throw new Error('pr_number is required for QA environments');
      }
    }

    // Create or get environment ID based on type
    let environmentId;
    if (environmentType === 'demo') {
      // For demo environments, we need to check if it exists by ID pattern
      const existingDemo = await get('SELECT id FROM environments WHERE id LIKE "demo-%" AND environment_type = "demo" LIMIT 1');
      if (existingDemo) {
        environmentId = existingDemo.id;
      } else {
        environmentId = await createEnvironmentId(null, null, 'demo');
      }
    } else {
      environmentId = await createEnvironmentId(repositoryName, prNumber, 'qa');
    }

    // Check if environment exists
    const existingEnv = await get('SELECT * FROM environments WHERE id = ?', [environmentId]);

    if (!existingEnv) {
      return createEnvironment(repositoryName, prNumber, services, environmentType);
    }

    // Set up environment with vertuoza-compose
    const environmentDir = await dockerComposeService.setupPrEnvironment(repositoryName, prNumber, services, environmentType);

    // Update the environment
    await dockerComposeService.startEnvironment(environmentDir, environmentType);

    // Create the URL for the PR environment
    const url = createEnvironmentUrl(environmentId);

    // Trigger certificate generation with a delay to ensure Tailscale is ready
    // This is done asynchronously so we don't block the environment update
    setTimeout(10000) // 10 second delay
      .then(() => tailscaleService.triggerCertificateGeneration(url))
      .catch(err => logger.error(`Error in delayed certificate generation: ${err.message}`));

    const servicesData = JSON.stringify(services);

    // Update database with appropriate values
    if (environmentType === 'demo') {
      await run(
        'UPDATE environments SET services_data = ?, status = ?, environment_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [servicesData, 'running', environmentType, environmentId]
      );
    } else {
      await run(
        'UPDATE environments SET repository_name = ?, services_data = ?, status = ?, environment_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [repositoryName, servicesData, 'running', environmentType, environmentId]
      );
    }

    // Log the action
    await run(
      'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
      [environmentId, 'update', 'success', `Environment updated successfully with ${services.length} services`]
    );

    // Return response with appropriate values
    const response = {
      id: environmentId,
      services: services.map(s => ({
        name: s.name,
        imageUrl: s.image_url
      })),
      status: 'running',
      url,
      environmentType
    };

    // Add repository_name and prNumber only for QA environments
    if (environmentType === 'qa') {
      response.repositoryName = repositoryName;
      response.prNumber = prNumber;
    }

    return response;
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
 * Remove an environment
 * @param {string} environmentId - Environment ID
 * @returns {Promise<Object>} - Result
 */
async function removeEnvironment(environmentId) {
  try {

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

    // Create simple response object
    const response = {
      id: environmentId,
      status: 'removed',
      message: 'Environment removed successfully'
    };

    return response;
  } catch (err) {
    logger.error(`Error removing environment: ${err.message}`);

    try {
      // Log error to database if possible
      await run(
        'INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)',
        [environmentId, 'remove', 'error', err.message]
      );
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
        environmentType: environment.environment_type || 'qa',
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
        environmentType: env.environment_type || 'qa',
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
