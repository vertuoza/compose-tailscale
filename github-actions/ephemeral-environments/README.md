# Ephemeral Environment Management

This GitHub Action allows you to create, update, or remove ephemeral environments for pull requests using the Ephemeral Environments API.

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `operation` | Operation to perform (`create` or `remove`) | Yes | `create` |
| `repository_name` | Name of the repository | Yes | |
| `pr_number` | PR number | Yes | |
| `services_json` | JSON array of services with name and image_url properties | No | `[]` |
| `github_token` | GitHub token for commenting on PRs | Yes | |
| `tailscale_client_id` | Tailscale OAuth client ID | Yes | |
| `tailscale_client_secret` | Tailscale OAuth client secret | Yes | |
| `api_url` | URL of the Ephemeral Environments API | No | `https://ephemeral-environments.tailf31c84.ts.net` |
| `tailscale_domain` | Tailscale domain for the ephemeral environment | No | `tailf31c84.ts.net` |

## Outputs

| Name | Description |
|------|-------------|
| `environment_url` | URL of the ephemeral environment (only for create operation) |
| `environment_id` | ID of the ephemeral environment |

## Usage

### Create or Update an Environment

```yaml
- name: Create/Update Ephemeral Environment
  uses: vertuoza/vertuo-actions/ephemeral-environments@main
  with:
    operation: create
    repository_name: my-repo
    pr_number: ${{ github.event.pull_request.number }}
    services_json: '[{"name":"frontend","image_url":"ghcr.io/myorg/frontend:latest"},{"name":"backend","image_url":"ghcr.io/myorg/backend:latest"}]'
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tailscale_client_id: ${{ secrets.TAILSCALE_CLIENT_ID }}
    tailscale_client_secret: ${{ secrets.TAILSCALE_CLIENT_SECRET }}
```

### Remove an Environment

```yaml
- name: Remove Ephemeral Environment
  uses: vertuoza/vertuo-actions/ephemeral-environments@main
  with:
    operation: remove
    repository_name: my-repo
    pr_number: ${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    tailscale_client_id: ${{ secrets.TAILSCALE_CLIENT_ID }}
    tailscale_client_secret: ${{ secrets.TAILSCALE_CLIENT_SECRET }}
```

## How It Works

This action:

1. Sets up Tailscale for secure networking
2. For `create` operation:
   - Checks if the environment already exists
   - Creates a new environment or updates an existing one
   - Comments on the PR with the environment URL
3. For `remove` operation:
   - Removes the environment
   - Comments on the PR about the removal

The environment ID is generated as `{repository_name}-pr-{pr_number}` and the URL as `https://{repository_name}-pr-{pr_number}.{tailscale_domain}`.
