const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const {
  createEnvironment,
  updateEnvironment,
  removeEnvironment,
  getEnvironment,
  listEnvironments,
  getEnvironmentLogs
} = require('../services/environmentService');
const dockerComposeService = require('../services/dockerComposeService');

/**
 * Create a new PR environment
 * POST /api/environments
 */
router.post('/', async (req, res) => {
  try {
    const { repository_name, pr_number, services } = req.body;

    // Validate required fields
    if (!repository_name) {
      return res.status(400).json({ error: 'repository_name is required' });
    }

    if (!pr_number) {
      return res.status(400).json({ error: 'pr_number is required' });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'At least one service is required' });
    }

    // Validate each service has name and image_url
    for (const service of services) {
      if (!service.name) {
        return res.status(400).json({ error: 'Each service must have a name' });
      }
      if (!service.image_url) {
        return res.status(400).json({ error: 'Each service must have an image_url' });
      }
    }

    // Create the environment with multiple services
    const environment = await createEnvironment(repository_name, pr_number, services);
    return res.status(201).json(environment);
  } catch (err) {
    logger.error(`Error creating environment: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update an existing PR environment
 * PUT /api/environments/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { repository_name, services } = req.body;

    // Parse the environment ID to get repository name and pr_number
    const parts = id.split('-pr-');

    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid environment ID format. Expected format: {repository_name}-pr-{pr_number}' });
    }

    const pr_number = parseInt(parts[1], 10);

    if (isNaN(pr_number)) {
      return res.status(400).json({ error: 'Invalid PR number in environment ID' });
    }

    // Validate required fields
    if (!repository_name) {
      return res.status(400).json({ error: 'repository_name is required' });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'At least one service is required' });
    }

    // Validate each service has name and image_url
    for (const service of services) {
      if (!service.name) {
        return res.status(400).json({ error: 'Each service must have a name' });
      }
      if (!service.image_url) {
        return res.status(400).json({ error: 'Each service must have an image_url' });
      }
    }

    // Update the environment with multiple services
    const environment = await updateEnvironment(repository_name, pr_number, services);
    return res.status(200).json(environment);
  } catch (err) {
    logger.error(`Error updating environment: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Remove a PR environment
 * DELETE /api/environments/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Parse the environment ID to get repository name and pr_number
    const parts = id.split('-pr-');

    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid environment ID format. Expected format: {repository_name}-pr-{pr_number}' });
    }

    const repositoryName = parts[0];
    const pr_number = parseInt(parts[1], 10);

    if (isNaN(pr_number)) {
      return res.status(400).json({ error: 'Invalid PR number in environment ID' });
    }

    // Remove the environment using the repository name extracted from the ID
    const result = await removeEnvironment(repositoryName, pr_number);

    return res.status(200).json(result);
  } catch (err) {
    logger.error(`Error removing environment: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get environment details
 * GET /api/environments/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the environment
    const environment = await getEnvironment(id);

    return res.status(200).json(environment);
  } catch (err) {
    logger.error(`Error getting environment: ${err.message}`);

    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
});

/**
 * List all environments
 * GET /api/environments
 */
router.get('/', async (req, res) => {
  try {
    const { status, repository_name, pr_number } = req.query;

    // Build filters
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (repository_name) {
      filters.repositoryName = repository_name;
    }

    if (pr_number) {
      filters.prNumber = parseInt(pr_number, 10);
    }

    // List environments
    const environments = await listEnvironments(filters);

    return res.status(200).json({ environments });
  } catch (err) {
    logger.error(`Error listing environments: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get environment logs
 * GET /api/environments/:id/logs
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;

    // Get logs for the environment
    const logs = await getEnvironmentLogs(id);

    return res.status(200).json({ logs });
  } catch (err) {
    logger.error(`Error getting environment logs: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Set up a local environment for testing without modifying service configurations
 * POST /api/environments/local-setup
 */
router.post('/local-setup', async (req, res) => {
  try {
    const { repository_name, pr_number } = req.body;

    // Validate required fields
    if (!repository_name) {
      return res.status(400).json({ error: 'repository_name is required' });
    }

    if (!pr_number) {
      return res.status(400).json({ error: 'pr_number is required' });
    }

    // Set up local environment with default services
    // We pass an empty array for services
    const environment = await createEnvironment(repository_name, pr_number, []);

    return res.status(201).json(environment);
  } catch (err) {
    logger.error(`Error setting up local environment: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get Docker Compose logs for an environment
 * GET /api/environments/:id/server-logs
 */
router.get('/:id/server-logs', async (req, res) => {
  try {
    const { id } = req.params;

    // Get Docker Compose logs for the environment
    const logs = await dockerComposeService.getEnvironmentLogs(id);

    return res.status(200).json({ logs });
  } catch (err) {
    logger.error(`Error getting Docker Compose logs: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
