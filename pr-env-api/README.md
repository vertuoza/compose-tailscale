# PR Environment API Server

A Node.js API server for managing PR environments with Docker Compose and Tailscale.

## Overview

This API server provides endpoints for creating, updating, and deleting PR environments using Docker Compose. It integrates with Tailscale to provide secure access to the environments.

## Features

- Create PR environments with Docker Compose
- Update existing PR environments
- Remove PR environments
- Track environment status and logs
- Tailscale integration for secure networking

## Prerequisites

- Docker and Docker Compose
- Tailscale
- Node.js 18+ (for local development)

## Installation

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pr-env-api.git
   cd pr-env-api
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the API server:
   ```bash
   docker-compose up -d
   ```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pr-env-api.git
   cd pr-env-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the API server:
   ```bash
   npm start
   ```

## Configuration

The API server can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to listen on | `3000` |
| `NODE_ENV` | Node environment | `production` |
| `TAILSCALE_DOMAIN` | Tailscale domain | `tailf31c84.ts.net` |
| `TAILSCALE_AUTH_KEY` | Tailscale auth key | None (required) |
| `DB_PATH` | Path to SQLite database | `/app/data/pr-environments.db` |
| `LOG_LEVEL` | Logging level | `info` |

> **Security Note**: The `TAILSCALE_AUTH_KEY` is used to authenticate the PR Environment API Server with Tailscale. You can get your Tailscale auth key from the [Tailscale admin console](https://login.tailscale.com/admin/settings/keys). The installation script will prompt you for this key if it's not set in the `.env` file.

## API Endpoints


### Environments

#### Create Environment

```
POST /api/environments
```

Request body:
```json
{
  "service_name": "kernel",
  "pr_number": 123,
  "image_url": "ghcr.io/vertuoza/kernel:pr-123"
}
```

Response:
```json
{
  "id": "kernel-pr-123",
  "serviceName": "kernel",
  "prNumber": 123,
  "status": "running",
  "url": "https://kernel-pr-123.tailf31c84.ts.net",
  "imageUrl": "ghcr.io/vertuoza/kernel:pr-123"
}
```

#### Update Environment

```
PUT /api/environments/:id
```

Request body:
```json
{
  "image_url": "ghcr.io/vertuoza/kernel:pr-123-updated"
}
```

Response:
```json
{
  "id": "kernel-pr-123",
  "serviceName": "kernel",
  "prNumber": 123,
  "status": "running",
  "url": "https://kernel-pr-123.tailf31c84.ts.net",
  "imageUrl": "ghcr.io/vertuoza/kernel:pr-123-updated"
}
```

#### Remove Environment

```
DELETE /api/environments/:id
```

Response:
```json
{
  "id": "kernel-pr-123",
  "status": "removed",
  "message": "Environment removed successfully"
}
```

#### Get Environment Details

```
GET /api/environments/:id
```

Response:
```json
{
  "id": "kernel-pr-123",
  "serviceName": "kernel",
  "prNumber": 123,
  "status": "running",
  "url": "https://kernel-pr-123.tailf31c84.ts.net",
  "imageUrl": "ghcr.io/vertuoza/kernel:pr-123",
  "createdAt": "2025-05-08T11:18:30.000Z",
  "updatedAt": "2025-05-08T11:18:30.000Z"
}
```

#### List Environments

```
GET /api/environments
```

Query parameters:
- `status`: Filter by status (e.g., `running`, `removed`)
- `service_name`: Filter by service name
- `pr_number`: Filter by PR number

Response:
```json
{
  "environments": [
    {
      "id": "kernel-pr-123",
      "serviceName": "kernel",
      "prNumber": 123,
      "status": "running",
      "url": "https://kernel-pr-123.tailf31c84.ts.net",
      "imageUrl": "ghcr.io/vertuoza/kernel:pr-123",
      "createdAt": "2025-05-08T11:18:30.000Z",
      "updatedAt": "2025-05-08T11:18:30.000Z"
    }
  ]
}
```

#### Get Environment Logs

```
GET /api/environments/:id/logs
```

Response:
```json
{
  "logs": [
    {
      "id": 1,
      "environment_id": "kernel-pr-123",
      "action": "create",
      "status": "success",
      "message": "Environment created successfully",
      "created_at": "2025-05-08T11:18:30.000Z"
    }
  ]
}
```

## GitHub Actions Integration

This API server can be integrated with GitHub Actions using a custom GitHub Action that handles PR environment management. Here's an example of how to use it:

```yaml
name: PR Environment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  # Build main service image
  build-main-service:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push main service image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/vertuoza/${{ github.repository.name }}:pr-${{ github.event.pull_request.number }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Manage PR environment
  manage-environment:
    needs: [build-main-service]
    if: always()
    runs-on: ubuntu-latest
    steps:
      # For PR opened/updated events
      - name: Create/Update PR Environment
        if: github.event.action != 'closed'
        uses: vertuoza/github-actions/pr-environment-create@main
        with:
          repository_name: ${{ github.repository.name }}
          pr_number: ${{ github.event.pull_request.number }}
          services_json: |
            [
              {
                "name": "${{ github.repository.name }}",
                "image_url": "ghcr.io/vertuoza/${{ github.repository.name }}:pr-${{ github.event.pull_request.number }}"
              }
            ]
          github_token: ${{ secrets.GITHUB_TOKEN }}

      # For PR closed events
      - name: Remove PR Environment
        if: github.event.action == 'closed'
        uses: vertuoza/github-actions/pr-environment-remove@main
        with:
          repository_name: ${{ github.repository.name }}
          pr_number: ${{ github.event.pull_request.number }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

The custom GitHub Action encapsulates the PR environment management logic, including:
- Connecting to Tailscale
- Creating, updating, or removing PR environments
- Commenting on PRs with environment URLs

This approach offers several benefits:
- **Maintainability**: Changes to the PR environment workflow only need to be made in one place
- **Consistency**: All services use the same workflow
- **Security**: Tailscale OAuth credentials are stored only in the github-actions repository
- **Flexibility**: The custom action can be versioned and updated independently
- **Simplicity**: Using GitHub Container Registry eliminates the need for external credentials

For more detailed information about GitHub Actions integration, see the [GitHub Actions Integration Guide](./docs/github-actions-integration.md).

## Project Structure

The project follows a modular structure with clear separation of concerns:

### Utils

- `utils/commandExecutor.js`: Handles shell command execution
- `utils/fileSystem.js`: Provides file system operations with error handling
- `utils/environmentConfig.js`: Manages environment configuration and paths
- `utils/logger.js`: Centralized logging functionality

### Services

- `services/environmentService.js`: High-level environment management
- `services/dockerComposeService.js`: Docker Compose specific operations

### Routes

- `routes/environments.js`: API endpoints for environment management

## Documentation

The following documentation is available:

- [API Reference](./docs/api-reference.md): Detailed information about the API endpoints
- [GitHub Actions Integration Guide](./docs/github-actions-integration.md): How to integrate with GitHub Actions
- [Setup Guide](./docs/setup-guide.md): How to set up the PR Environment API Server

## License

MIT
