# Scripts Directory

This directory contains utility scripts for the ephemeral environments project.

## update-tailscale-ip.sh

Automatically updates the `ALLOWED_IMPERSONATION_IPS` variable in `vertuoza-compose/.env` with the current IP address of the Tailscale container.

### Purpose

The auth manager detects the Tailscale service IP address instead of a static IP, and this can vary between different setups. This script ensures that the correct IP is always used for authorization.

### Usage

The script is automatically executed when you run:
```bash
make docker-start
```

You can also run it manually:
```bash
make update-tailscale-ip
# or directly:
./scripts/update-tailscale-ip.sh
```

**From the vertuoza-compose/ directory:**
```bash
cd vertuoza-compose
make docker-start
# or manually:
make update-tailscale-ip
```

### How it works

1. Waits for the Tailscale container (`tailscale-subdomain-ts`) to be running and have an IP address
2. Extracts the container's IP using `docker inspect`
3. Updates only the `ALLOWED_IMPERSONATION_IPS` line in `vertuoza-compose/.env`
4. Validates the IP format before updating
5. Preserves all other content in the .env file

### Error handling

- **Container not found**: Script fails with clear error message
- **Container starting**: Script waits up to 60 seconds for container to be ready
- **No IP assigned**: Script fails if container has no IP address
- **Invalid IP format**: Script validates IP format before updating
- **File write errors**: Script verifies the update was successful

### Integration with workflow

The script is integrated into your existing Makefile workflow and works from both directories:

**From project root:**
1. `make sops-decrypt` - Decrypt .env files
2. `make docker-start` - Start services and automatically update Tailscale IP
3. `make sops-encrypt` - Encrypt .env files (optional)

**From vertuoza-compose/ directory:**
1. `make sops-decrypt` - Decrypt .env files
2. `make docker-start` - Start services and automatically update Tailscale IP
3. `make sops-encrypt` - Encrypt .env files (optional)

The script automatically detects which directory it's being run from and updates the correct .env file. This ensures that every time you start your services, the Tailscale IP is automatically detected and updated, making your setup portable across different environments.
