# PR Environment Create/Update Action

This GitHub Action creates or updates PR environments using the PR Environment API.

## Description

The PR Environment Create/Update Action is designed to:

1. Create a new PR environment when a PR is opened
2. Update an existing PR environment when a PR is updated

It connects to Tailscale, calls the PR Environment API to create or update the environment, and comments on the PR with the environment URL.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `repository_name` | Name of the repository | Yes | |
| `pr_number` | PR number | Yes | |
| `services_json` | JSON array of services with name and image_url properties | Yes | |
| `github_token` | GitHub token for commenting on PRs | Yes | |
| `api_url` | URL of the PR Environment API | No | 'https://pr-env-api.tailf31c84.ts.net' |
| `tailscale_domain` | Tailscale domain for the PR environment | No | 'tailf31c84.ts.net' |

## Outputs

| Output | Description |
|--------|-------------|
| `environment_url` | URL of the PR environment |
| `environment_id` | ID of the PR environment |

## Example Usage

```yaml
- name: Create/Update PR Environment
  uses: vertuoza/github-actions/pr-environment-create@main
  with:
    repository_name: ${{ needs.setup.outputs.service_name }}
    pr_number: ${{ needs.setup.outputs.pr_number }}
    services_json: |
      [
        {
          "name": "${{ needs.setup.outputs.service_name }}",
          "image_url": "ghcr.io/vertuoza/${{ needs.setup.outputs.service_name }}:pr-${{ needs.setup.outputs.pr_number }}"
        },
        {
          "name": "${{ needs.setup.outputs.service_name }}-migrations",
          "image_url": "ghcr.io/vertuoza/${{ needs.setup.outputs.service_name }}-migrations:pr-${{ needs.setup.outputs.pr_number }}"
        }
      ]
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## How It Works

1. Sets the environment ID and URL based on the repository name and PR number
2. Connects to Tailscale using the OAuth credentials
3. Calls the PR Environment API to create or update the environment with the specified services
4. Comments on the PR with the environment URL

## Notes

- This action is designed to be used in conjunction with the PR Environment Remove Action
- It should be called when a PR is opened, synchronized, or reopened
- The `services_json` parameter should contain an array of services with `name` and `image_url` properties
- The environment ID is constructed as `{repository_name}-pr-{pr_number}`
- The environment URL is constructed as `https://{repository_name}-pr-{pr_number}.{tailscale_domain}`
