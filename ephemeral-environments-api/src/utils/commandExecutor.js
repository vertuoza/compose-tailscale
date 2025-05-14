const { exec } = require('child_process');
const { logger } = require('./logger');

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

module.exports = {
  executeCommand
};
