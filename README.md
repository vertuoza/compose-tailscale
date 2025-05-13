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
   cp pr-env-api/examples/github-workflow.yml /path/to/your/repo/.github/workflows/pr-environment.yml
   ```

4. Customize the workflow file as needed for your repository.

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

## Documentation

- [PR Environment API Server Documentation](./pr-env-api/docs/)
- [GitHub Actions Integration Guide](./pr-env-api/docs/github-actions-integration.md)
- [API Reference](./pr-env-api/docs/api-reference.md)
- [Setup Guide](./pr-env-api/docs/setup-guide.md)

## License

MIT
