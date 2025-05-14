# PR Environment API Server Setup Guide

This guide explains how to set up the PR Environment API Server on your Ubuntu VM.

## Prerequisites

- Ubuntu VM with Docker and Docker Compose installed
- Tailscale installed and configured
- Access to GitHub repositories for setting up GitHub Actions

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pr-env-api.git
cd pr-env-api
```

### 2. Install the PR Environment API Server

Run the installation script:

```bash
./install.sh
```

This script will:
- Check if Docker, Docker Compose, and Tailscale are installed
- Create a `.env` file with the necessary configuration (if it doesn't exist)
- Prompt you to enter your Tailscale auth key and domain
- Create data and logs directories
- Build and start the Docker containers
- Make the API server accessible at `http://localhost:3000` and via Tailscale at `https://pr-env-api.tailf31c84.ts.net`

> **Security Note**: The installation script will prompt you for your Tailscale auth key, which is used to authenticate the PR Environment API Server with Tailscale. You can get your Tailscale auth key from the [Tailscale admin console](https://login.tailscale.com/admin/settings/keys).

### 4. Verify the Installation

Check that the API server is running:

```bash
docker compose ps
```

You should see the `pr-env-api` container running.

Test the API server:

```bash
curl http://localhost:3000/health
```

You should get a response like:

```json
{"status":"ok"}
```

## GitHub Actions Integration

### 1. Add the GitHub Actions Workflow

Copy the example workflow file to your repository:

```bash
cp examples/github-workflow.yml /path/to/your/repo/.github/workflows/pr-environment.yml
```

### 2. Customize the Workflow

Customize the workflow file as needed for your repository:

- Update the Docker image registry if needed
- Adjust the environment variables
- Modify the PR comment template

### 3. Test the Setup

Create a pull request in your repository to test the setup. The GitHub Actions workflow should:

1. Build a Docker image for your PR
2. Call the PR Environment API Server to create a PR environment
3. Comment on the PR with the environment URL

## Troubleshooting

### API Server Not Starting

Check the logs:

```bash
docker compose logs pr-env-api
```

### Tailscale Configuration Issues

Check the Tailscale logs:

```bash
docker logs vertuoza-platform-ts
```

### GitHub Actions Issues

Check the GitHub Actions logs in your repository.

## Maintenance

### Updating the API Server

To update the API server:

```bash
git pull
docker compose down
docker compose up -d --build
```

### Backing Up the Database

The database is stored in the `data` directory. To back it up:

```bash
cp data/pr-environments.db /path/to/backup/
```

### Monitoring

You can monitor the API server logs:

```bash
docker compose logs -f pr-env-api
```

## Project Structure

The PR Environment API Server follows a modular structure with clear separation of concerns:

### Utils

- `utils/commandExecutor.js`: Handles shell command execution with proper error handling
- `utils/fileSystem.js`: Provides file system operations with consistent error handling and logging
- `utils/environmentConfig.js`: Manages environment configuration, IDs, paths, and URLs
- `utils/logger.js`: Centralized logging functionality

### Services

- `services/environmentService.js`: High-level environment management that orchestrates other services
- `services/dockerComposeService.js`: Docker Compose specific operations for environment setup and management

### Routes

- `routes/environments.js`: API endpoints for environment management

## API Documentation

See the [API Reference](./api-reference.md) file for detailed API documentation.
