# Vertuoza Compose

This directory contains a Docker Compose setup for running the Vertuoza platform services. It's used by the PR Environment API Server to create isolated environments for each PR.

## Overview

The Vertuoza Compose setup includes all the necessary services to run the Vertuoza platform:

- **Tailscale**: For secure networking and HTTPS support
- **Kernel**: The main backend service
- **Identity**: User identity management
- **Auth**: Authentication service
- **Work**: Work management service
- **AI**: AI-powered features
- **Gateway**: API gateway
- **Client Space**: Client portal
- **Vertuosoft**: Legacy backend
- **Front**: Frontend application
- **Planning**: Planning application
- **Databases**: MySQL and PostgreSQL

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Tailscale
- Repository must be cloned to the root level of your home directory (`~/compose-tailscale`) for the Docker volume mounts to work correctly

### Installation

1. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. Start the services:
   ```bash
   ./restart.sh [tailscale-auth-key]
   ```

   You can provide a Tailscale auth key as an argument to the restart.sh script. If not provided, it will use the one in the docker-compose.yml file.

### Accessing the Services

Once the services are running, you can access them at the following URLs:

- Vertuosoft (default): https://tailscale-subdomain.tailf31c84.ts.net
- Kernel: https://tailscale-subdomain.tailf31c84.ts.net/kernel
- Identity: https://tailscale-subdomain.tailf31c84.ts.net/identity
- Auth: https://tailscale-subdomain.tailf31c84.ts.net/auth
- Work: https://tailscale-subdomain.tailf31c84.ts.net/work
- PDF Builder: https://tailscale-subdomain.tailf31c84.ts.net/pdf-builder
- AI: https://tailscale-subdomain.tailf31c84.ts.net/ai
- Gateway: https://tailscale-subdomain.tailf31c84.ts.net/gateway
- Client Space: https://tailscale-subdomain.tailf31c84.ts.net/client-space
- Front: https://tailscale-subdomain.tailf31c84.ts.net/front
- Planning: https://tailscale-subdomain.tailf31c84.ts.net/planning

## Configuration

The Vertuoza Compose setup can be configured using environment variables in the .env file. Here are some of the key variables:

- `TAILSCALE_AUTH_KEY`: Tailscale auth key for secure networking
- `APP_URL`: Base URL for the application
- `FRONT_URL`: URL for the frontend application
- `GATEWAY_URL`: URL for the API gateway
- `KERNEL_URL`: URL for the kernel service
- `VERTUO_IDENTITY_URL`: URL for the identity service
- `VERTUO_AUTH_URL`: URL for the auth service
- `VERTUO_WORK_URL`: URL for the work service
- `VERTUO_AI_URL`: URL for the AI service
- `CLIENT_SPACE_URL`: URL for the client space service

## Security

- The Tailscale auth key should be stored in the .env file and not committed to the repository.
- The docker-compose.yml file should not contain hardcoded secrets.

## Troubleshooting

### Tailscale Issues

If you encounter issues with Tailscale, check the logs:

```bash
docker logs tailscale-subdomain
```

### Service Issues

Check the logs for the specific service:

```bash
docker logs <service-name>
```

### Database Issues

Check the logs for the database services:

```bash
docker logs mysql
docker logs postgres
```

## Integration with PR Environment API Server

The Vertuoza Compose setup is used by the PR Environment API Server to create isolated environments for each PR. The PR Environment API Server creates a copy of this directory for each PR, configures it with PR-specific settings, and starts the environment.

For more information, see the [PR Environment API Server documentation](../pr-env-api/README.md).
