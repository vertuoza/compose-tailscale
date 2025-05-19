# API Reference

This document provides detailed information about the PR Environment API Server endpoints.

## Endpoints

### Environments

#### Create Environment

```
POST /api/environments
```

Request body:
```json
{
  "repository_name": "vertuoza",
  "pr_number": 123,
  "environment_type": "qa", // Optional, defaults to "qa", can be "qa" or "demo"
  "services": [
    {
      "name": "kernel",
      "image_url": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
    }
  ]
}
```

Response:
```json
{
  "id": "vertuoza-pr-123",
  "repositoryName": "vertuoza",
  "services": [
    {
      "name": "kernel",
      "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
    }
  ],
  "prNumber": 123,
  "status": "running",
  "url": "https://vertuoza-pr-123.tailf31c84.ts.net",
  "environmentType": "qa"
}
```

#### Update Environment

```
PUT /api/environments/:id
```

Request body:
```json
{
  "repository_name": "vertuoza",
  "environment_type": "demo", // Optional, defaults to "qa", can be "qa" or "demo"
  "services": [
    {
      "name": "kernel",
      "image_url": "europe-west1-docker.pkg.dev/vertuoza-demo-382712/vertuoza/kernel:pr-123-updated"
    }
  ]
}
```

Response:
```json
{
  "id": "vertuoza-pr-123",
  "repositoryName": "vertuoza",
  "services": [
    {
      "name": "kernel",
      "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-demo-382712/vertuoza/kernel:pr-123-updated"
    }
  ],
  "prNumber": 123,
  "status": "running",
  "url": "https://vertuoza-pr-123.tailf31c84.ts.net",
  "environmentType": "demo"
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
  "id": "vertuoza-pr-123",
  "repositoryName": "vertuoza",
  "services": [
    {
      "name": "kernel",
      "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
    }
  ],
  "prNumber": 123,
  "status": "running",
  "url": "https://vertuoza-pr-123.tailf31c84.ts.net",
  "environmentType": "qa",
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
- `repository_name`: Filter by repository name
- `pr_number`: Filter by PR number

Response:
```json
{
  "environments": [
    {
      "id": "vertuoza-pr-123",
      "repositoryName": "vertuoza",
      "services": [
        {
          "name": "kernel",
          "imageUrl": "europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
        }
      ],
      "prNumber": 123,
      "status": "running",
      "url": "https://vertuoza-pr-123.tailf31c84.ts.net",
      "environmentType": "qa",
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

### Health Check

#### Get Health Status

```
GET /health
```

Response:
```json
{
  "status": "ok"
}
```

## Error Responses

All API endpoints return appropriate HTTP status codes and error messages in case of failure.

Example error response:
```json
{
  "error": "Resource not found"
}
```

Common HTTP status codes:
- `200 OK`: The request was successful
- `201 Created`: The resource was created successfully
- `400 Bad Request`: The request was invalid
- `404 Not Found`: The resource was not found
- `500 Internal Server Error`: An error occurred on the server

## Rate Limiting

The API does not currently implement rate limiting, but it may be added in the future.

## Pagination

The API does not currently implement pagination, but it may be added in the future.

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

## Versioning

The API does not currently implement versioning, but it may be added in the future.

## CORS

The API does not currently implement CORS, but it may be added in the future.

## Webhooks

The API does not currently implement webhooks, but it may be added in the future.
