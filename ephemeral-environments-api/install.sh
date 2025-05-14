#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ephemeral Environments API Server Installation ===${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
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
    echo -e "${GREEN}Created .env file.${NC}"
    echo -e "${YELLOW}Please edit the .env file to set your Tailscale auth key and domain.${NC}"
    echo -e "${BLUE}You can get your Tailscale auth key from:${NC} https://login.tailscale.com/admin/settings/keys"
    read -p "Would you like to enter your Tailscale auth key now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Tailscale auth key: " tailscale_auth_key
        sed -i "s/your-tailscale-auth-key/$tailscale_auth_key/g" .env
        read -p "Enter your Tailscale domain (default: tailf31c84.ts.net): " tailscale_domain
        tailscale_domain=${tailscale_domain:-tailf31c84.ts.net}
        sed -i "s/your-tailscale-domain.ts.net/$tailscale_domain/g" .env
        echo -e "${GREEN}Updated .env file with Tailscale configuration.${NC}"
    else
        echo -e "${YELLOW}Please edit the .env file manually before starting the server.${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}.env file already exists. Skipping creation.${NC}"
    # Check if TAILSCALE_AUTH_KEY is set in .env
    if ! grep -q "TAILSCALE_AUTH_KEY" .env || grep -q "TAILSCALE_AUTH_KEY=your-tailscale-auth-key" .env; then
        echo -e "${YELLOW}Warning: TAILSCALE_AUTH_KEY is not set in .env file.${NC}"
        echo -e "${BLUE}You can get your Tailscale auth key from:${NC} https://login.tailscale.com/admin/settings/keys"
        read -p "Would you like to enter your Tailscale auth key now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter your Tailscale auth key: " tailscale_auth_key
            if grep -q "TAILSCALE_AUTH_KEY" .env; then
                sed -i "s/TAILSCALE_AUTH_KEY=.*/TAILSCALE_AUTH_KEY=$tailscale_auth_key/g" .env
            else
                echo "TAILSCALE_AUTH_KEY=$tailscale_auth_key" >> .env
            fi
            echo -e "${GREEN}Updated .env file with Tailscale auth key.${NC}"
        else
            echo -e "${YELLOW}Please edit the .env file manually before starting the server.${NC}"
            exit 0
        fi
    fi
fi

# Create data and logs directories
echo -e "${BLUE}Creating data and logs directories...${NC}"
mkdir -p data/environments logs

# Build and start the API server
echo -e "${BLUE}Building and starting the API server...${NC}"
docker compose up -d --build

# Check if the API server is running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Ephemeral Environments API Server is now running!${NC}"
    echo -e "${BLUE}You can access it at:${NC} http://localhost:3000"
    echo -e "${BLUE}Or via Tailscale at:${NC} https://ephemeral-environments-api.tailf31c84.ts.net"


    echo ""
    echo -e "${GREEN}=== Installation Complete ===${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Add the GitHub Actions workflow to your repositories"
    echo -e "2. Test the setup by creating a PR"
else
    echo -e "${RED}Failed to start the Ephemeral Environments API Server.${NC}"
    echo -e "${YELLOW}Check the logs for more information:${NC} docker-compose logs"
fi
