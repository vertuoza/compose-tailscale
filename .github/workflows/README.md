# GitHub Workflows

This directory contains GitHub Actions workflows for automating various tasks in the repository.

## deploy-main.yml

This workflow automatically deploys the repository to a remote server when changes are pushed to the main branch.

### Workflow Steps

1. Checks out the code
2. Sets up a Tailscale connection with the "tag:actions" tag
3. Transfers the repository to the remote server using rsync
4. Rebuilds the API on the remote server

### Required Secrets and Variables

#### Secrets

- `TAILSCALE_CLIENT_ID`: Tailscale OAuth client ID
- `TAILSCALE_CLIENT_SECRET`: Tailscale OAuth secret

#### Variables

- `REMOTE_HOST`: The hostname or IP address of the remote server to deploy to

### Excluded Directories

The following directories are excluded from the rsync transfer to preserve existing data:

- `.git/`
- `pr-env-api/data/`
- `pr-env-api/logs/`
- `pr-env-api/state/`

### Setup Instructions

1. Go to your repository settings on GitHub
2. Navigate to "Secrets and variables" > "Actions"
3. Add the required secrets:
   - `TAILSCALE_CLIENT_ID`: Your Tailscale OAuth client ID
   - `TAILSCALE_CLIENT_SECRET`: Your Tailscale OAuth secret
4. Add the required variables:
   - `REMOTE_HOST`: The hostname or IP address of your remote server

### Tailscale Setup

1. Ensure your remote server is connected to Tailscale
2. Make sure the GitHub Actions runner can connect to your remote server via Tailscale
3. The remote server should accept connections from nodes with the "tag:actions" tag
