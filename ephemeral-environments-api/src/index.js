const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const cors = require('cors');
const { setupDatabase } = require('./database');
const { logger } = require('./utils/logger');
const fileSystem = require('./utils/fileSystem');

// Load environment variables
dotenv.config({ path: fileSystem.joinPath(__dirname, '../.env') });

// Create data directory if it doesn't exist
const dataDir = fileSystem.joinPath(__dirname, '../data');
fs.ensureDirSync(dataDir);
fs.ensureDirSync(fileSystem.joinPath(dataDir, 'environments'));

// Create Express app
const app = express();

// Configure trust proxy to handle requests coming through Tailscale
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
const environmentRoutes = require('./routes/environments');

// Apply routes
app.use('/environments', environmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

// Wrap server startup in an async function to handle database initialization
async function startServer() {
  try {
    // Initialize the database
    await setupDatabase();

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`PR Environment API Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();
