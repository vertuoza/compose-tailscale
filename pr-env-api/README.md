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
  "image_url": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
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
  "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
}
```

#### Update Environment

```
PUT /api/environments/:id
```

Request body:
```json
{
  "image_url": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123-updated"
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
  "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123-updated"
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
  "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123",
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
      "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123",
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

Here's an example of how to use this API in a GitHub Actions workflow:

```yaml
name: PR Environment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  pr-environment:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Set environment variables
        id: env
        run: |
          echo "SERVICE_NAME=$(echo ${{ github.repository }} | cut -d '/' -f 2)" >> $GITHUB_OUTPUT
          echo "PR_NUMBER=${{ github.event.pull_request.number }}" >> $GITHUB_OUTPUT
          echo "PR_ACTION=${{ github.event.action }}" >> $GITHUB_OUTPUT
          echo "DOMAIN=${SERVICE_NAME}-pr-${PR_NUMBER}.tailf31c84.ts.net" >> $GITHUB_OUTPUT

      # Handle PR opened/updated
      - name: Setup GCP credentials
        if: github.event.action != 'closed'
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Set up Docker Buildx
        if: github.event.action != 'closed'
        uses: docker/setup-buildx-action@v2

      - name: Login to GCP Container Registry
        if: github.event.action != 'closed'
        uses: docker/login-action@v2
        with:
          registry: europe-west1-docker.pkg.dev
          username: _json_key
          password: ${{ secrets.GCP_CREDENTIALS }}

      - name: Build and push Docker image
        if: github.event.action != 'closed'
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/${{ steps.env.outputs.SERVICE_NAME }}:pr-${{ steps.env.outputs.PR_NUMBER }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Connect to Tailscale
        uses: tailscale/github-action@v2
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
          tags: tag:github-actions

      - name: Create/Update PR environment
        if: github.event.action != 'closed'
        run: |
          # Create or update the environment
          curl -X POST https://pr-env-api.tailf31c84.ts.net/api/environments \
            -H "Content-Type: application/json" \
            -d '{
              "service_name": "${{ steps.env.outputs.SERVICE_NAME }}",
              "pr_number": ${{ steps.env.outputs.PR_NUMBER }},
              "image_url": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/${{ steps.env.outputs.SERVICE_NAME }}:pr-${{ steps.env.outputs.PR_NUMBER }}"
            }'

      - name: Comment on PR
        if: github.event.action != 'closed'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const url = `https://${{ steps.env.outputs.DOMAIN }}`;

            github.rest.issues.createComment({
              issue_number: ${{ steps.env.outputs.PR_NUMBER }},
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 PR environment deployed at: ${url}\n\nThis environment will be automatically updated when you push new commits to this PR.`
            });

      # Handle PR closed
      - name: Remove PR environment
        if: github.event.action == 'closed'
        run: |
          curl -X DELETE https://pr-env-api.tailf31c84.ts.net/api/environments/${{ steps.env.outputs.SERVICE_NAME }}-pr-${{ steps.env.outputs.PR_NUMBER }}

      - name: Comment on PR about removal
        if: github.event.action == 'closed'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: ${{ steps.env.outputs.PR_NUMBER }},
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🧹 PR environment has been removed.`
            });
```

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
