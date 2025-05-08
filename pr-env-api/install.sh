#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PR Environment API Server Installation ===${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Tailscale is installed
if ! command -v tailscale &> /dev/null; then
    echo -e "${RED}Tailscale is not installed. Please install Tailscale first.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env

    # No JWT secret needed anymore

    # Set the correct paths
    BASE_COMPOSE_FILE=$(pwd)/../docker-compose.yml
    TAILSCALE_CONFIG_PATH=$(pwd)/../config/vertuoza-platform.json

    sed -i "s|BASE_COMPOSE_FILE=.*|BASE_COMPOSE_FILE=$BASE_COMPOSE_FILE|" .env
    sed -i "s|TAILSCALE_CONFIG_PATH=.*|TAILSCALE_CONFIG_PATH=$TAILSCALE_CONFIG_PATH|" .env

    echo -e "${GREEN}Created .env file with correct paths.${NC}"
else
    echo -e "${YELLOW}.env file already exists. Skipping creation.${NC}"
fi

# Create data and logs directories
echo -e "${BLUE}Creating data and logs directories...${NC}"
mkdir -p data/environments logs

# Build and start the API server
echo -e "${BLUE}Building and starting the API server...${NC}"
docker-compose up -d --build

# Check if the API server is running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}PR Environment API Server is now running!${NC}"
    echo -e "${BLUE}You can access it at:${NC} http://localhost:3000"
    echo -e "${BLUE}Or via Tailscale at:${NC} https://pr-env-api.tailf31c84.ts.net"


    echo ""
    echo -e "${GREEN}=== Installation Complete ===${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Add the GitHub Actions workflow to your repositories"
    echo -e "2. Test the setup by creating a PR"
else
    echo -e "${RED}Failed to start the PR Environment API Server.${NC}"
    echo -e "${YELLOW}Check the logs for more information:${NC} docker-compose logs"
fi
