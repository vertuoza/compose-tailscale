# Vertuoza Ephemeral Environments System

This repository contains three main components for managing ephemeral environments for Vertuoza services:

1. **Ephemeral Environment API Server** (`ephemeral-environments-api/`): A Node.js API server for creating, updating, and removing ephemeral environments
2. **Ephemeral Environment Frontend** (`ephemeral-environments-frontend/`): A web interface for managing and monitoring ephemeral environments
3. **Vertuoza Compose** (`vertuoza-compose/`): A Docker Compose setup for running the Vertuoza platform services

## Overview

The Ephemeral Environments System allows you to automatically create isolated environments for each pull request in your GitHub repositories. This enables developers and reviewers to test changes in a real environment before merging them into the main branch.

## Components

### Ephemeral Environments API Server

The Ephemeral Environments API Server provides a RESTful API for managing ephemeral environments. It integrates with GitHub Actions to automatically create, update, and remove environments when PRs are opened, updated, or closed.

Key features:
- Create ephemeral environments with Docker Compose
- Update existing ephemeral environments
- Remove ephemeral environments
- Track environment status and logs
- Tailscale integration for secure networking

[Learn more about the Ephemeral Environments API Server](./ephemeral-environments-api/README.md)

### Ephemeral Environments Frontend

The Ephemeral Environments Frontend provides a web interface for managing and monitoring ephemeral environments. It communicates with the API server to display environment status, logs, and allows for manual operations.

Key features:
- Dashboard view of all environments
- Environment status monitoring
- View environment logs
- Manual environment management (delete)
- Responsive design

### GitHub Workflows

The repository includes GitHub Actions workflows for automating various tasks:

- **Ephemeral Environments Workflow**: Automatically creates, updates, and removes ephemeral environments when PRs are opened, updated, or closed.
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

2. Set up Google Cloud authentication for decrypting environment files:
   ```bash
   gcloud auth login
   gcloud config set project vertuoza-qa
   gcloud auth application-default login
   ```

   If you are already authorized, you can just switch the project context for Default Application Credentials:
   ```bash
   gcloud auth application-default set-quota-project vertuoza-qa
   ```

3. Decrypt the `.env` files:
   ```bash
   make sops-decrypt
   ```

   This will decrypt both the root `.env` file and the `vertuoza-compose/.env` file.

4. Edit the `.env` files as needed to set your Tailscale credentials and other configuration options.

5. Start the services using the makefile:
   ```bash
   make
   ```

3. Configure GitHub Actions in your repositories:
   ```bash
   # For Ephemeral Environments workflow
   cp ephemeral-environments-api/examples/github-workflow.yml /path/to/your/repo/.github/workflows/ephemeral-environment.yml

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

## Troubleshooting

### Tailscale Issues

If Tailscale is not working properly, you can restart just the Tailscale service with:

```bash
docker compose restart tailscale
```

This command will restart only the Tailscale container without affecting the other services in your stack. After running this command, wait a few moments for Tailscale to re-establish its connections.

## Architecture

The system works as follows:

1. When a PR is opened or updated in a GitHub repository, the GitHub Actions workflow builds a Docker image for the PR.
2. The workflow calls the Ephemeral Environments API Server to create or update an ephemeral environment.
3. The Ephemeral Environments API Server creates a copy of the Vertuoza Compose setup for the PR, configures it with the PR-specific settings, and starts the environment.
4. The Ephemeral Environments API Server returns the URL of the ephemeral environment, which is posted as a comment on the PR.
5. When the PR is closed, the GitHub Actions workflow calls the Ephemeral Environments API Server to remove the ephemeral environment.
6. The Ephemeral Environments Frontend provides a web interface for monitoring and managing these environments.

### Routing Configuration

The system uses Tailscale for networking and routing:

- The frontend is accessible at the root path (`/`) through `ephemeral-environments.tailf31c84.ts.net`
- The API is accessible through the `/api` path (e.g., `/api/environments`)
- Tailscale handles the routing between these components securely

## Security

- The Ephemeral Environments API Server uses Tailscale for secure networking.
- Tailscale auth keys are stored in environment variables and not committed to the repository.
- GitHub Actions uses Tailscale OAuth to connect to the Ephemeral Environments API Server.
- The Deploy to Remote Server workflow uses Tailscale for secure SSH connections to the remote server.
- The remote server should be configured to accept connections from Tailscale nodes with the "tag:github-actions" tag.
- Environment variables are encrypted using Google Cloud KMS via the `sops` tool before being committed to the repository.

### Environment Variables Encryption

This project uses [sops](https://github.com/mozilla/sops) with Google Cloud KMS to encrypt sensitive environment variables. This allows us to securely store `.env` files in the repository without exposing sensitive information.

#### Prerequisites for Encryption/Decryption

1. Install [sops](https://github.com/mozilla/sops/releases)
2. Set up Google Cloud authentication:
   ```bash
   gcloud auth login
   gcloud config set project vertuoza-qa
   gcloud auth application-default login
   ```

#### Encrypting Environment Variables

If you modify any `.env` file and want to commit the changes, you need to encrypt it first:

```bash
make sops-encrypt
```

This will create encrypted `.env.enc` files that can be safely committed to the repository.

#### Decrypting Environment Variables

To decrypt the environment variables:

```bash
make sops-decrypt
```

This will decrypt the `.env.enc` files into `.env` files that can be used by the application.

#### Workflow

1. Decrypt the environment variables: `make sops-decrypt`
2. Make changes to the `.env` files as needed
3. Encrypt the updated environment variables: `make sops-encrypt`
4. Commit the encrypted `.env.enc` files to the repository

## Documentation

- [Ephemeral Environments API Server Documentation](./ephemeral-environments-api/docs/)
- [GitHub Actions Integration Guide](./ephemeral-environments-api/docs/github-actions-integration.md)
- [API Reference](./ephemeral-environments-api/docs/api-reference.md)
- [Setup Guide](./ephemeral-environments-api/docs/setup-guide.md)
- [GitHub Workflows Documentation](./.github/workflows/README.md)

## License

MIT
