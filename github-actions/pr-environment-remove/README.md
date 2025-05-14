# PR Environment Remove Action

This GitHub Action removes PR environments using the PR Environment API.

## Description

The PR Environment Remove Action is designed to:

1. Remove a PR environment when a PR is closed

It connects to Tailscale, calls the PR Environment API to remove the environment, and comments on the PR about the removal.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `repository_name` | Name of the repository | Yes | |
| `pr_number` | PR number | Yes | |
| `github_token` | GitHub token for commenting on PRs | Yes | |
| `api_url` | URL of the PR Environments API | No | 'https://ephemeral-environments-api.tailf31c84.ts.net' |
| `tailscale_domain` | Tailscale domain for the PR environment | No | 'tailf31c84.ts.net' |

## Outputs

| Output | Description |
|--------|-------------|
| `environment_id` | ID of the PR environment |

## Example Usage

```yaml
- name: Remove PR Environment
  uses: vertuoza/github-actions/pr-environment-remove@main
  with:
    repository_name: ${{ needs.setup.outputs.service_name }}
    pr_number: ${{ needs.setup.outputs.pr_number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## How It Works

1. Sets the environment ID based on the repository name and PR number
2. Connects to Tailscale using the OAuth credentials
3. Calls the PR Environment API to remove the environment
4. Comments on the PR about the removal

## Notes

- This action is designed to be used in conjunction with the PR Environment Create/Update Action
- It should be called when a PR is closed
- The environment ID is constructed as `{repository_name}-pr-{pr_number}`
- The API extracts the repository name from the environment ID, so you don't need to provide it separately in the API call
