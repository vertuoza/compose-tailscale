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

### 2. Configure Tailscale

Run the Tailscale setup script to add the PR Environment API Server to your Tailscale configuration:

```bash
./setup-tailscale.sh
```

This script will:
- Add the PR Environment API Server to your Tailscale configuration
- Restart Tailscale to apply the changes
- Make the API server accessible at `https://pr-env-api.tailf31c84.ts.net`

### 3. Install the PR Environment API Server

Run the installation script:

```bash
./install.sh
```

This script will:
- Create a `.env` file with the necessary configuration
- Build and start the Docker container

### 4. Verify the Installation

Check that the API server is running:

```bash
docker-compose ps
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
docker-compose logs pr-env-api
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
docker-compose down
docker-compose up -d --build
```

### Backing Up the Database

The database is stored in the `data` directory. To back it up:

```bash
cp data/pr-environments.db /path/to/backup/
```

### Monitoring

You can monitor the API server logs:

```bash
docker-compose logs -f pr-env-api
```

## API Documentation

See the [README.md](../README.md) file for detailed API documentation.
