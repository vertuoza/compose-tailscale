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
    const { repository_name, pr_number, services, environment_type = 'qa' } = req.body;

    // Validate required fields based on environment type
    if (environment_type === 'qa') {
      if (!repository_name) {
        return res.status(400).json({ error: 'repository_name is required for QA environments' });
      }

      if (!pr_number) {
        return res.status(400).json({ error: 'pr_number is required for QA environments' });
      }
    }

    // Ensure services is an array (default to empty array if not provided)
    if (!services) {
      services = [];
    } else if (!Array.isArray(services)) {
      return res.status(400).json({ error: 'Services must be an array' });
    }

    // If services are provided, validate each service has name and image_url
    for (const service of services) {
      if (!service.name) {
        return res.status(400).json({ error: 'Each service must have a name' });
      }
      if (!service.image_url) {
        return res.status(400).json({ error: 'Each service must have an image_url' });
      }
    }

    // Validate environment_type if provided
    if (environment_type && !['qa', 'demo'].includes(environment_type)) {
      return res.status(400).json({ error: 'environment_type must be either "qa" or "demo"' });
    }

    // Create the environment with multiple services and environment type
    const environment = await createEnvironment(repository_name, pr_number, services, environment_type);
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
    const { repository_name, services, environment_type = 'qa' } = req.body;

    let pr_number;

    // Handle different ID formats based on environment type
    if (environment_type === 'demo') {
      // For demo environments, we don't need to parse the ID
      if (!id.startsWith('demo-')) {
        return res.status(400).json({ error: 'Invalid demo environment ID format. Expected format: demo-{number}' });
      }
    } else {
      // For QA environments, parse the ID to get repository name and PR number
      const parts = id.split('-pr-');

      if (parts.length !== 2) {
        return res.status(400).json({ error: 'Invalid QA environment ID format. Expected format: {repository_name}-pr-{pr_number}' });
      }

      pr_number = parseInt(parts[1], 10);

      if (isNaN(pr_number)) {
        return res.status(400).json({ error: 'Invalid PR number in environment ID' });
      }

      // Validate required fields for QA environments
      if (!repository_name) {
        return res.status(400).json({ error: 'repository_name is required for QA environments' });
      }
    }

    // Ensure services is an array (default to empty array if not provided)
    if (!services) {
      services = [];
    } else if (!Array.isArray(services)) {
      return res.status(400).json({ error: 'Services must be an array' });
    }

    // If services are provided, validate each service has name and image_url
    for (const service of services) {
      if (!service.name) {
        return res.status(400).json({ error: 'Each service must have a name' });
      }
      if (!service.image_url) {
        return res.status(400).json({ error: 'Each service must have an image_url' });
      }
    }

    // Validate environment_type if provided
    if (environment_type && !['qa', 'demo'].includes(environment_type)) {
      return res.status(400).json({ error: 'environment_type must be either "qa" or "demo"' });
    }

    // Update the environment with multiple services and environment type
    const environment = await updateEnvironment(repository_name, pr_number, services, environment_type);
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

    let repositoryName, pr_number;

    // Handle different ID formats
    if (id.startsWith('demo-')) {
      // For demo environments, we don't need repository name or PR number
      // Pass null values to removeEnvironment
      repositoryName = null;
      pr_number = null;
    } else {
      // For QA environments, parse the ID to get repository name and PR number
      const parts = id.split('-pr-');

      if (parts.length !== 2) {
        return res.status(400).json({ error: 'Invalid QA environment ID format. Expected format: {repository_name}-pr-{pr_number}' });
      }

      repositoryName = parts[0];
      pr_number = parseInt(parts[1], 10);

      if (isNaN(pr_number)) {
        return res.status(400).json({ error: 'Invalid PR number in environment ID' });
      }
    }

    // Remove the environment
    const result = await removeEnvironment(repositoryName, pr_number, id);

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
