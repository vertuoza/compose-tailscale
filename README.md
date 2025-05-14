# Vertuoza PR Environment System

This repository contains two main components for managing PR environments for Vertuoza services:

1. **PR Environment API Server** (`pr-env-api/`): A Node.js API server for creating, updating, and removing PR environments
2. **Vertuoza Compose** (`vertuoza-compose/`): A Docker Compose setup for running the Vertuoza platform services

## Overview

The PR Environment System allows you to automatically create isolated environments for each pull request in your GitHub repositories. This enables developers and reviewers to test changes in a real environment before merging them into the main branch.

## Components

### PR Environment API Server

The PR Environment API Server provides a RESTful API for managing PR environments. It integrates with GitHub Actions to automatically create, update, and remove environments when PRs are opened, updated, or closed.

Key features:
- Create PR environments with Docker Compose
- Update existing PR environments
- Remove PR environments
- Track environment status and logs
- Tailscale integration for secure networking

[Learn more about the PR Environment API Server](./pr-env-api/README.md)

### GitHub Workflows

The repository includes GitHub Actions workflows for automating various tasks:

- **PR Environment Workflow**: Automatically creates, updates, and removes PR environments when PRs are opened, updated, or closed.
- **Deploy to Remote Server Workflow**: Automatically deploys the repository to a remote server when changes are pushed to the main branch. This workflow uses Tailscale for secure SSH connections.

[Learn more about GitHub Workflows](./.github/workflows/README.md)

### Vertuoza Compose

The Vertuoza Compose setup provides a Docker Compose configuration for running the Vertuoza platform services. It's used by the PR Environment API Server to create isolated environments for each PR.

Key components:
- Tailscale integration for secure networking
- Multiple Vertuoza services (kernel, identity, auth, work, ai, etc.)
- Database services (MySQL, PostgreSQL)
- Frontend services (front, planning)

[Learn more about Vertuoza Compose](./vertuoza-compose/README.md)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Tailscale
- Node.js 18+ (for local development)
- GitHub repository with GitHub Actions enabled

### Installation

1. Clone this repository to your home directory:
   ```bash
   git clone https://github.com/yourusername/compose-tailscale.git ~/compose-tailscale
   cd ~/compose-tailscale
   ```
   **Important**: The repository must be cloned to the root level of your home directory (`~/compose-tailscale`) for the Docker volume mounts to work correctly.

2. Set up the PR Environment API Server:
   ```bash
   cd pr-env-api
   ./install.sh
   ```

3. Configure GitHub Actions in your repositories:
   ```bash
   # For PR Environment workflow
   cp pr-env-api/examples/github-workflow.yml /path/to/your/repo/.github/workflows/pr-environment.yml

   # For Deploy to Remote Server workflow
   cp .github/workflows/deploy-main.yml /path/to/your/repo/.github/workflows/
   ```

4. Customize the workflow files as needed for your repository.

5. Set up the required secrets and variables for the Deploy to Remote Server workflow:
   - Go to your repository settings on GitHub
   - Navigate to "Secrets and variables" > "Actions"
   - Add the required secrets:
     - `TAILSCALE_CLIENT_ID`: Your Tailscale OAuth client ID
     - `TAILSCALE_CLIENT_SECRET`: Your Tailscale OAuth secret
   - Add the required variables:
     - `REMOTE_HOST`: The hostname or IP address of your remote server

## Architecture

The system works as follows:

1. When a PR is opened or updated in a GitHub repository, the GitHub Actions workflow builds a Docker image for the PR.
2. The workflow calls the PR Environment API Server to create or update a PR environment.
3. The PR Environment API Server creates a copy of the Vertuoza Compose setup for the PR, configures it with the PR-specific settings, and starts the environment.
4. The PR Environment API Server returns the URL of the PR environment, which is posted as a comment on the PR.
5. When the PR is closed, the GitHub Actions workflow calls the PR Environment API Server to remove the PR environment.

## Security

- The PR Environment API Server uses Tailscale for secure networking.
- Tailscale auth keys are stored in environment variables and not committed to the repository.
- GitHub Actions uses Tailscale OAuth to connect to the PR Environment API Server.
- The Deploy to Remote Server workflow uses Tailscale for secure SSH connections to the remote server.
- The remote server should be configured to accept connections from Tailscale nodes with the "tag:actions" tag.

## Documentation

- [PR Environment API Server Documentation](./pr-env-api/docs/)
- [GitHub Actions Integration Guide](./pr-env-api/docs/github-actions-integration.md)
- [API Reference](./pr-env-api/docs/api-reference.md)
- [Setup Guide](./pr-env-api/docs/setup-guide.md)
- [GitHub Workflows Documentation](./.github/workflows/README.md)

## License

MIT
