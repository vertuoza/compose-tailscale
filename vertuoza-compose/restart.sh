#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting Vertuoza Platform with Tailscale Integration for HTTPS ===${NC}"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
  source .env
  echo -e "${BLUE}Loaded environment variables from .env file.${NC}"
fi

# Check if TS_AUTHKEY is provided as an argument, use it from .env, or use the default in docker-compose.yml
if [ -n "$1" ]; then
  export TAILSCALE_AUTH_KEY=$1
  echo -e "${BLUE}Using provided Tailscale auth key.${NC}"
elif [ -n "$TAILSCALE_AUTH_KEY" ]; then
  echo -e "${BLUE}Using Tailscale auth key from .env file.${NC}"
else
  echo -e "${YELLOW}No Tailscale auth key provided, using the default in docker-compose.yml.${NC}"
  echo -e "${YELLOW}You can provide a different key as the first argument to this script or set TAILSCALE_AUTH_KEY in .env file.${NC}"
fi

# Stop any existing containers
echo -e "${BLUE}Stopping any existing containers...${NC}"
docker compose down --remove-orphans
docker rm -f tailscale-subdomain 2>/dev/null || true

# Remove all volumes except Tailscale volume
echo -e "${BLUE}Removing volumes except Tailscale...${NC}"
docker volume rm $(docker volume ls -q | grep -v "vertuoza-ts-state") 2>/dev/null || true

# Start the services
echo -e "${BLUE}Starting services...${NC}"
docker compose up -d

# Check Tailscale status
echo -e "${BLUE}Checking Tailscale status...${NC}"
docker exec tailscale-subdomain tailscale status

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo -e "${BLUE}You can now access the following services:${NC}"
echo -e "Vertuosoft (default): https://tailscale-subdomain.tailf31c84.ts.net"
echo -e "Kernel: https://tailscale-subdomain.tailf31c84.ts.net/kernel"
echo -e "Identity: https://tailscale-subdomain.tailf31c84.ts.net/identity"
echo -e "Auth: https://tailscale-subdomain.tailf31c84.ts.net/auth"
echo -e "Work: https://tailscale-subdomain.tailf31c84.ts.net/work"
echo -e "PDF Builder: https://tailscale-subdomain.tailf31c84.ts.net/pdf-builder"
echo -e "AI: https://tailscale-subdomain.tailf31c84.ts.net/ai"
echo -e "Gateway: https://tailscale-subdomain.tailf31c84.ts.net/gateway"
echo -e "Client Space: https://tailscale-subdomain.tailf31c84.ts.net/client-space"
echo -e "Front: https://tailscale-subdomain.tailf31c84.ts.net/front"
echo -e "Planning: https://tailscale-subdomain.tailf31c84.ts.net/planning"
echo ""
echo -e "${YELLOW}Note: It may take a few moments for the Tailscale certificates to be generated.${NC}"
echo -e "${YELLOW}If you encounter any issues, check the logs with:${NC}"
echo -e "${BLUE}docker logs tailscale-subdomain${NC}"
