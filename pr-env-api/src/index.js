const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const { setupDatabase } = require('./database');
const { logger } = require('./utils/logger');
const fileSystem = require('./utils/fileSystem');

// Load environment variables
dotenv.config({ path: fileSystem.joinPath(__dirname, '../.env') });

// Create data directory if it doesn't exist
const dataDir = fileSystem.joinPath(__dirname, '../data');
fs.ensureDirSync(dataDir);
fs.ensureDirSync(fileSystem.joinPath(dataDir, 'environments'));

// Initialize the database
setupDatabase();

// Create Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
const environmentRoutes = require('./routes/environments');

// Apply routes
app.use('/api/environments', environmentRoutes);

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`PR Environment API Server running on port ${PORT}`);
});
