const axios = require('axios');
const https = require('https');
const { logger } = require('../utils/logger');

// Tailscale API base URL
const TAILSCALE_API_BASE_URL = 'https://api.tailscale.com/api/v2';

/**
 * Get OAuth token from Tailscale API
 * @returns {Promise<string>} - OAuth access token
 */
async function getOAuthToken() {
  try {
    // Get Tailscale OAuth credentials from environment variables
    const clientId = process.env.TAILSCALE_CLIENT_ID;
    const clientSecret = process.env.TAILSCALE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Tailscale OAuth credentials not configured');
    }

    // Request OAuth token
    const response = await axios.post(
      `${TAILSCALE_API_BASE_URL}/oauth/token`,
      `client_id=${clientId}&client_secret=${clientSecret}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Return the access token
    return response.data.access_token;
  } catch (err) {
    logger.error(`Error getting Tailscale OAuth token: ${err.message}`);
    throw err;
  }
}

/**
 * Remove a machine from Tailscale network
 * @param {string} environmentId - Environment ID (used as the machine hostname)
 * @returns {Promise<boolean>} - Success status
 */
async function removeTailscaleMachine(environmentId) {
  try {
    // Get Tailscale domain from environment variables
    const domain = process.env.TAILSCALE_DOMAIN;

    if (!domain) {
      logger.warn('Tailscale domain not configured, skipping Tailscale machine removal');
      return false;
    }

    // Get OAuth token
    const accessToken = await getOAuthToken();

    // First, list devices to find the one with our hostname
    const listResponse = await axios.get(`${TAILSCALE_API_BASE_URL}/tailnet/${domain}/devices`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Find the device with the matching hostname
    const device = listResponse.data.devices.find(d =>
      d.hostname === environmentId ||
      d.name === environmentId ||
      d.name === `${environmentId}.${process.env.TAILSCALE_DOMAIN}`
    );

    if (!device) {
      logger.warn(`No Tailscale device found with hostname ${environmentId}`);
      return false;
    }

    // Delete the device
    await axios.delete(`${TAILSCALE_API_BASE_URL}/device/${device.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    logger.info(`Successfully removed Tailscale machine for environment ${environmentId}`);
    return true;
  } catch (err) {
    logger.error(`Error removing Tailscale machine: ${err.message}`);
    // Don't throw the error, just return false to indicate failure
    // This way, if Tailscale removal fails, it won't block the rest of the environment cleanup
    return false;
  }
}

/**
 * Trigger certificate generation for a Tailscale environment
 * @param {string} environmentUrl - The URL of the environment
 * @returns {Promise<boolean>} - Success status
 */
async function triggerCertificateGeneration(environmentUrl) {
  try {
    logger.info(`Triggering certificate generation for ${environmentUrl}`);

    // Create an HTTPS agent that ignores SSL certificate errors
    // This is necessary because we're trying to access a URL that might not have valid certs yet
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    // Make a request to the environment URL with a timeout
    // We don't care about the response, just that the request is made
    await axios.get(environmentUrl, {
      httpsAgent: agent,
      timeout: 20000, // 20 second timeout
      validateStatus: () => true // Accept any status code
    });

    logger.info(`Successfully triggered certificate generation for ${environmentUrl}`);
    return true;
  } catch (err) {
    logger.warn(`Error triggering certificate generation for ${environmentUrl}: ${err.message}`);
    // Don't throw the error, just return false to indicate failure
    // This way, if certificate generation fails, it won't block the rest of the environment creation
    return false;
  }
}

module.exports = {
  getOAuthToken,
  removeTailscaleMachine,
  triggerCertificateGeneration
};
