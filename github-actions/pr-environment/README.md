# PR Environment GitHub Action

This GitHub Action automates the creation, update, and removal of PR environments using the PR Environment API.

## Overview

This action handles the following tasks:
- Connecting to Tailscale to access the PR Environment API
- Creating or updating PR environments when a PR is opened or updated
- Removing PR environments when a PR is closed
- Commenting on PRs with environment URLs

## Usage

### Basic Usage

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

      # Only for PR opened/updated
      - name: Build and push Docker image
        if: github.event.action != 'closed'
        # ... (Docker build steps)

      # Use the custom action
      - name: Manage PR Environment
        uses: vertuoza/github-actions/pr-environment@main
        with:
          service_name: ${{ github.repository.name }}
          pr_number: ${{ github.event.pull_request.number }}
          pr_action: ${{ github.event.action }}
          image_url: ghcr.io/vertuoza/${{ github.repository.name }}:pr-${{ github.event.pull_request.number }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `service_name` | Name of the service | Yes | |
| `pr_number` | PR number | Yes | |
| `pr_action` | PR action (opened, synchronize, reopened, closed) | Yes | |
| `image_url` | Docker image URL | No | '' |
| `github_token` | GitHub token for commenting on PRs | Yes | |
| `api_url` | URL of the PR Environment API | No | 'https://pr-env-api.tailf31c84.ts.net' |
| `tailscale_domain` | Tailscale domain for the PR environment | No | 'tailf31c84.ts.net' |

### Outputs

| Output | Description |
|--------|-------------|
| `environment_url` | URL of the PR environment |
| `environment_id` | ID of the PR environment |

### Required Secrets

This action requires the following secrets to be set in the github-actions repository:

- `TS_OAUTH_CLIENT_ID`: Tailscale OAuth client ID
- `TS_OAUTH_SECRET`: Tailscale OAuth secret

## Examples

### Using with a Different API URL

```yaml
- name: Manage PR Environment
  uses: vertuoza/github-actions/pr-environment@main
  with:
    service_name: ${{ github.repository.name }}
    pr_number: ${{ github.event.pull_request.number }}
    pr_action: ${{ github.event.action }}
    image_url: europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/${{ github.repository.name }}:pr-${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    api_url: https://custom-api-url.example.com
```

### Using with a Different Tailscale Domain

```yaml
- name: Manage PR Environment
  uses: vertuoza/github-actions/pr-environment@main
  with:
    service_name: ${{ github.repository.name }}
    pr_number: ${{ github.event.pull_request.number }}
    pr_action: ${{ github.event.action }}
    image_url: europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/${{ github.repository.name }}:pr-${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tailscale_domain: custom-domain.ts.net
```

## How It Works

1. When a PR is opened or updated:
   - The action connects to Tailscale using the OAuth credentials stored in the github-actions repository
   - It calls the PR Environment API to create or update the environment
   - It comments on the PR with the environment URL

2. When a PR is closed:
   - The action connects to Tailscale using the OAuth credentials stored in the github-actions repository
   - It calls the PR Environment API to remove the environment
   - It comments on the PR about the removal

## Troubleshooting

### Action Fails to Connect to Tailscale

- Check that the `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_SECRET` secrets are correctly set in the github-actions repository
- Verify that the Tailscale OAuth client has the correct permissions

### Action Fails to Call the PR Environment API

- Check that the PR Environment API is running and accessible
- Verify that the API URL is correct
- Check the Tailscale ACLs to ensure the GitHub Actions runner has access to the PR Environment API

### PR Comment Not Created

- Check that the `github_token` input is correctly set
- Verify that the GitHub token has the correct permissions to comment on PRs
