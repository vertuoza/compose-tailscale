# GitHub Actions Integration Guide

This guide explains how to integrate the PR Environment API Server with GitHub Actions to automatically create, update, and remove PR environments.

## Overview

The PR Environment API Server provides an API for managing PR environments. GitHub Actions can use this API to:

1. Create a new PR environment when a PR is opened
2. Update an existing PR environment when a PR is updated
3. Remove a PR environment when a PR is closed

## Prerequisites

- PR Environment API Server installed and running
- Access to GitHub repositories for setting up GitHub Actions
- Tailscale account with OAuth client set up

## Setting Up GitHub Actions

### 1. Set Up Tailscale OAuth for GitHub Actions

To allow GitHub Actions to connect to your Tailscale network:

1. Go to the Tailscale admin console at https://login.tailscale.com/admin/settings/oauth
2. Click "Add OAuth Client"
3. Enter a name (e.g., "GitHub Actions")
4. Set the redirect URL to `https://github.com/login/oauth/authorize`
5. Save the client
6. Copy the Client ID and Client Secret

Add these credentials to your github-actions repository secrets:

1. Go to your github-actions repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Name: `TS_OAUTH_CLIENT_ID`
5. Value: Your Tailscale OAuth Client ID
6. Click "Add secret"
7. Click "New repository secret" again
8. Name: `TS_OAUTH_SECRET`
9. Value: Your Tailscale OAuth Client Secret
10. Click "Add secret"

### 2. GitHub Container Registry Access

By default, GitHub Actions workflows have access to the GitHub Container Registry (ghcr.io) using the `GITHUB_TOKEN` that is automatically provided to all workflows. No additional configuration is needed for basic usage.

If you need to customize access permissions:

1. Go to your repository
2. Navigate to "Settings" > "Actions" > "General"
3. Scroll down to "Workflow permissions"
4. Ensure "Read and write permissions" is selected
5. Click "Save"

### 3. Create the GitHub Actions Workflow File

Create a file at `.github/workflows/pr-environment.yml` in your service repository with the following content:

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

  # Build migrations image
  build-migrations:
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

      - name: Build and push migrations image
        uses: docker/build-push-action@v4
        with:
          context: ./migrations  # Adjust this path to where your migrations Dockerfile is located
          push: true
          tags: ghcr.io/vertuoza/${{ github.repository.name }}-migrations:pr-${{ github.event.pull_request.number }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Manage PR environment
  manage-environment:
    needs: [build-main-service, build-migrations]
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
              },
              {
                "name": "${{ github.repository.name }}-migrations",
                "image_url": "ghcr.io/vertuoza/${{ github.repository.name }}-migrations:pr-${{ github.event.pull_request.number }}"
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

### 4. Customize the Workflow

Customize the workflow file as needed for your repository:

- Adjust the environment variables
- Modify the custom action inputs if needed

### 5. Parallel Builds for Improved Performance

The workflow is designed to build Docker images in parallel to improve performance:

1. The `build-main-service` and `build-migrations` jobs run in parallel since they have no dependencies on each other
2. The `manage-environment` job depends on both build jobs and only runs after both build jobs are complete

This parallel execution significantly reduces the overall workflow execution time, especially when building multiple Docker images. The workflow uses GitHub Actions' job dependencies to orchestrate the parallel execution while ensuring that the PR environment is only created or updated after all images are built and pushed.

Key benefits:
- Faster PR environment creation and updates
- More efficient use of GitHub Actions runners
- Reduced waiting time for developers
- Simplified workflow using GitHub context variables directly

### 6. Separate Actions for Creation and Removal

The workflow uses two separate GitHub Actions for clarity and separation of concerns:

1. **PR Environment Create/Update Action**: Used when a PR is opened, synchronized, or reopened
   - Connects to Tailscale
   - Creates or updates the PR environment with the specified services
   - Comments on the PR with the environment URL

2. **PR Environment Remove Action**: Used when a PR is closed
   - Connects to Tailscale
   - Removes the PR environment
   - Comments on the PR about the removal

This separation makes the workflow more explicit and easier to understand, especially for the PR closing process. The workflow uses conditional steps to call the appropriate action based on the PR event type:

```yaml
# For PR opened/updated events
- name: Create/Update PR Environment
  if: github.event.action != 'closed'
  uses: vertuoza/github-actions/pr-environment-create@main
  # ...

# For PR closed events
- name: Remove PR Environment
  if: github.event.action == 'closed'
  uses: vertuoza/github-actions/pr-environment-remove@main
  # ...
```

## Custom GitHub Action

The workflow above uses a custom GitHub Action that encapsulates the PR environment management logic. This action is maintained in the github-actions repository and provides a consistent way to manage PR environments across all services.

### Action Inputs

#### PR Environment Create/Update Action

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `repository_name` | Name of the repository | Yes | |
| `pr_number` | PR number | Yes | |
| `services_json` | JSON array of services with name and image_url properties | Yes | |
| `github_token` | GitHub token for commenting on PRs | Yes | |
| `api_url` | URL of the PR Environment API | No | 'https://pr-env-api.tailf31c84.ts.net' |
| `tailscale_domain` | Tailscale domain for the PR environment | No | 'tailf31c84.ts.net' |

#### PR Environment Remove Action

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `repository_name` | Name of the repository | Yes | |
| `pr_number` | PR number | Yes | |
| `github_token` | GitHub token for commenting on PRs | Yes | |
| `api_url` | URL of the PR Environment API | No | 'https://pr-env-api.tailf31c84.ts.net' |
| `tailscale_domain` | Tailscale domain for the PR environment | No | 'tailf31c84.ts.net' |

### Action Outputs

#### PR Environment Create/Update Action

| Output | Description |
|--------|-------------|
| `environment_url` | URL of the PR environment |
| `environment_id` | ID of the PR environment |

#### PR Environment Remove Action

| Output | Description |
|--------|-------------|
| `environment_id` | ID of the PR environment |

### How the Action Works

The custom action:

1. Connects to Tailscale using the OAuth credentials stored in the github-actions repository
2. Calls the PR Environment API to create, update, or remove environments based on the PR action
3. Comments on the PR with the environment URL or removal notification

### Benefits of Using the Custom Action

- **Maintainability**: Changes to the PR environment workflow only need to be made in one place
- **Consistency**: All services use the same workflow
- **Security**: Tailscale OAuth credentials are stored only in the github-actions repository
- **Flexibility**: The custom action can be versioned and updated independently

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

## Testing the Integration

Create a pull request in your repository to test the integration. The GitHub Actions workflow should:

1. Build a Docker image for your PR
2. Call the PR Environment API Server to create a PR environment
3. Comment on the PR with the environment URL

## Troubleshooting

### GitHub Actions Workflow Not Running

- Check that the workflow file is in the correct location (`.github/workflows/pr-environment.yml`)
- Check that the workflow file has the correct syntax
- Check that GitHub Actions is enabled for your repository

### API Server Not Responding

- Check that the PR Environment API Server is running
- Check that the API server is accessible from GitHub Actions

### PR Environment Not Created

- Check the GitHub Actions logs for error messages
- Check the PR Environment API Server logs for error messages
- Check that the Docker image was built and pushed successfully

### Tailscale Connection Issues

- Check that the Tailscale OAuth credentials are correct in the github-actions repository
- Verify that the GitHub Actions runner has been added to your Tailscale network
- Check the Tailscale ACLs to ensure the GitHub Actions runner has access to the PR Environment API Server
- Look for Tailscale connection errors in the GitHub Actions logs

### GitHub Container Registry Issues

- Check that the workflow has the necessary permissions to push to the GitHub Container Registry
- Verify that the repository visibility settings allow for the desired package visibility
- Look for authentication errors in the GitHub Actions logs

## Advanced Configuration

### Using a Different Container Registry

If you're using a different container registry, update the workflow file accordingly:

```yaml
# For Docker Hub
- name: Login to Docker Hub
  if: github.event.action != 'closed'
  uses: docker/login-action@v2
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

- name: Build and push Docker image
  if: github.event.action != 'closed'
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: yourusername/yourrepo:pr-${{ github.event.pull_request.number }}
```

```yaml
# For Google Container Registry
- name: Setup GCP credentials
  if: github.event.action != 'closed'
  uses: google-github-actions/auth@v1
  with:
    credentials_json: ${{ secrets.GCP_CREDENTIALS }}

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
    tags: europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/${{ github.repository.name }}:pr-${{ github.event.pull_request.number }}
```

### Using a Different Domain

If you're using a different Tailscale domain, specify it in the custom action:

```yaml
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
    tailscale_domain: your-custom-domain.ts.net
```

> **Note**: The environment ID is constructed using the repository name (`{repository_name}-pr-{pr_number}`). When removing an environment, the API extracts the repository name from this ID, so you don't need to provide it separately.

### Using a Different API Server URL

If your API server is at a different URL, specify it in the custom action:

```yaml
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
    api_url: https://your-custom-api-url.example.com
```
