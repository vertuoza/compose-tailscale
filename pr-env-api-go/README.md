# PR Environment API (Go Implementation)

A Go implementation of the PR Environment API server for managing PR environments with Docker Compose and Tailscale.

## Overview

This API server provides endpoints for creating, updating, and deleting PR environments using Docker Compose. It integrates with Tailscale to provide secure access to the environments.

## Features

- Create PR environments with Docker Compose
- Update existing PR environments
- Remove PR environments
- Track environment status and logs
- Tailscale integration for secure networking

## Project Structure

The project follows a clean, layered architecture:

```
pr-env-api-go/
├── cmd/
│   └── server/         # Application entry point
├── internal/
│   ├── config/         # Configuration management
│   ├── database/       # Database connection and models
│   ├── handlers/       # HTTP handlers
│   ├── models/         # Data models
│   ├── repositories/   # Data access layer
│   ├── services/       # Business logic
│   └── utils/          # Utility packages
│       ├── commandexecutor/
│       ├── filesystem/
│       ├── logger/
│       └── envconfig/
└── pkg/                # Reusable packages
```

## Prerequisites

- Docker and Docker Compose
- Tailscale
- Go 1.21 or later (for local development)

## Configuration

The API server can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to listen on | `3000` |
| `NODE_ENV` | Environment | `development` |
| `TAILSCALE_DOMAIN` | Tailscale domain | `tailf31c84.ts.net` |
| `TAILSCALE_AUTH_KEY` | Tailscale auth key | None (required) |
| `DB_PATH` | Path to SQLite database | `./data/pr-environments.db` |
| `LOG_LEVEL` | Logging level | `info` |
| `DATA_DIR` | Data directory | `./data` |

## Development Status

This project is currently in Phase 6 of the migration from JavaScript to Go. The following components have been implemented:

- [x] Project structure and configuration
- [x] Core utilities (logger, filesystem, command executor)
- [x] Environment configuration utilities
- [x] Basic data models
- [x] Database layer
  - [x] SQLite connection and initialization
  - [x] Repository interfaces
  - [x] Environment repository implementation
  - [x] Environment log repository implementation
  - [x] Transaction support
- [x] Services layer
  - [x] Service interfaces
  - [x] Docker Compose service implementation
  - [x] Environment service implementation
  - [x] Service factory pattern
- [x] API layer
  - [x] HTTP router using Gin
  - [x] Environment API handlers
  - [x] Middleware (logging, CORS, error handling)
  - [x] Request validation
- [x] Testing and documentation
  - [x] Unit tests for utilities
  - [x] Integration tests for API handlers
  - [x] API documentation with Swagger/OpenAPI
  - [x] Makefile for common tasks
- [x] Deployment and CI/CD
  - [x] Dockerfile with multi-stage build
  - [x] Docker Compose configuration
  - [x] GitHub Actions CI/CD pipeline
  - [x] Deployment scripts

## Getting Started

### Prerequisites

- Go 1.21 or later
- Docker and Docker Compose
- Tailscale account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vertuoza/pr-env-api.git
   cd pr-env-api-go
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to set your Tailscale auth key and other configuration.

4. Build the application:
   ```bash
   make build
   ```

### Running the Application

```bash
make run
```

### Running Tests

```bash
make test
```

To run tests with coverage:

```bash
make test-coverage
```

## API Documentation

API documentation is available in OpenAPI/Swagger format at `api/swagger.yaml`.

## License

MIT
