const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const {
  createEnvironment,
  updateEnvironment,
  removeEnvironment,
  getEnvironment,
  listEnvironments
} = require('../services/docker-compose');

/**
 * Create a new PR environment
 * POST /api/environments
 */
router.post('/', async (req, res) => {
  try {
    const { service_name, pr_number, image_url, config } = req.body;

    // Validate required fields
    if (!service_name) {
      return res.status(400).json({ error: 'service_name is required' });
    }

    if (!pr_number) {
      return res.status(400).json({ error: 'pr_number is required' });
    }

    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    // Create the environment
    const environment = await createEnvironment(service_name, pr_number, image_url, config || {});

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
    const { image_url, config } = req.body;

    // Parse the environment ID to get service_name and pr_number
    const parts = id.split('-pr-');

    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid environment ID format. Expected format: {service_name}-pr-{pr_number}' });
    }

    const service_name = parts[0];
    const pr_number = parseInt(parts[1], 10);

    if (isNaN(pr_number)) {
      return res.status(400).json({ error: 'Invalid PR number in environment ID' });
    }

    // Validate required fields
    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    // Update the environment
    const environment = await updateEnvironment(service_name, pr_number, image_url, config || {});

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

    // Parse the environment ID to get service_name and pr_number
    const parts = id.split('-pr-');

    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid environment ID format. Expected format: {service_name}-pr-{pr_number}' });
    }

    const service_name = parts[0];
    const pr_number = parseInt(parts[1], 10);

    if (isNaN(pr_number)) {
      return res.status(400).json({ error: 'Invalid PR number in environment ID' });
    }

    // Remove the environment
    const result = await removeEnvironment(service_name, pr_number);

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
    const { status, service_name, pr_number } = req.query;

    // Build filters
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (service_name) {
      filters.serviceName = service_name;
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
    const { all } = require('../database');

    // Get logs for the environment
    const logs = await all(
      'SELECT * FROM environment_logs WHERE environment_id = ? ORDER BY created_at DESC',
      [id]
    );

    return res.status(200).json({ logs });
  } catch (err) {
    logger.error(`Error getting environment logs: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
