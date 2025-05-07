#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting Vertuoza Platform with Tailscale Integration for HTTPS ===${NC}"
echo ""

# Check if TS_AUTHKEY is provided or use the one in the compose file
if [ -n "$1" ]; then
  export TS_AUTHKEY=$1
  echo -e "${BLUE}Using provided TS_AUTHKEY.${NC}"
else
  echo -e "${YELLOW}No TS_AUTHKEY provided, using the one in docker-compose.yml.${NC}"
  echo -e "${YELLOW}You can provide a different key as the first argument to this script.${NC}"
fi

# Stop any existing containers
echo -e "${BLUE}Stopping any existing containers...${NC}"
docker compose down --remove-orphans
docker rm -f vertuoza-platform-ts 2>/dev/null || true

# Remove all volumes except Tailscale volume
echo -e "${BLUE}Removing volumes except Tailscale...${NC}"
docker volume rm $(docker volume ls -q | grep -v "vertuoza-ts-state") 2>/dev/null || true

# Start the services
echo -e "${BLUE}Starting services...${NC}"
docker compose up -d

# Check Tailscale status
echo -e "${BLUE}Checking Tailscale status...${NC}"
docker exec vertuoza-platform-ts tailscale status

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo -e "${BLUE}You can now access the following services:${NC}"
echo -e "Vertuosoft (default): https://vertuoza-platform-ubuntu.tailf31c84.ts.net"
echo -e "Kernel: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/kernel"
echo -e "Identity: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/identity"
echo -e "Auth: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/auth"
echo -e "Work: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/work"
echo -e "PDF Builder: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/pdf-builder"
echo -e "AI: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/ai"
echo -e "Gateway: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/gateway"
echo -e "Client Space: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/client-space"
echo -e "Front: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/front"
echo -e "Planning: https://vertuoza-platform-ubuntu.tailf31c84.ts.net/planning"
echo ""
echo -e "${YELLOW}Note: It may take a few moments for the Tailscale certificates to be generated.${NC}"
echo -e "${YELLOW}If you encounter any issues, check the logs with:${NC}"
echo -e "${BLUE}docker logs vertuoza-platform-ts${NC}"
