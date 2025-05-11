#!/bin/bash
set -e

# Configuration
SERVER_USER=${1:-"deploy"}
SERVER_HOST=${2:-"your-server-hostname"}
DEPLOY_PATH=${3:-"/opt/pr-env-api"}
IMAGE_NAME="pr-env-api:latest"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print usage
function usage {
  echo -e "${YELLOW}Usage:${NC} $0 [server_user] [server_host] [deploy_path]"
  echo -e "  server_user: SSH user for the server (default: deploy)"
  echo -e "  server_host: Hostname or IP of the server (default: your-server-hostname)"
  echo -e "  deploy_path: Path on the server to deploy to (default: /opt/pr-env-api)"
  exit 1
}

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error:${NC} .env file not found. Please create it first."
  echo -e "You can copy .env.example and modify it."
  exit 1
fi

# Print deployment info
echo -e "${GREEN}Deploying PR Environment API to:${NC}"
echo -e "  Server: ${SERVER_USER}@${SERVER_HOST}"
echo -e "  Path: ${DEPLOY_PATH}"
echo

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker build -t ${IMAGE_NAME} .

# Save the Docker image
echo -e "${GREEN}Saving Docker image...${NC}"
docker save ${IMAGE_NAME} > pr-env-api.tar

# Ensure the deployment directory exists on the server
echo -e "${GREEN}Creating deployment directory...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${DEPLOY_PATH}"

# Copy files to the server
echo -e "${GREEN}Copying files to server...${NC}"
scp docker-compose.yml ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp .env ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp pr-env-api.tar ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# Load the Docker image on the server
echo -e "${GREEN}Loading Docker image on server...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${DEPLOY_PATH} && docker load < pr-env-api.tar && rm pr-env-api.tar"

# Start the service
echo -e "${GREEN}Starting the service...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${DEPLOY_PATH} && docker-compose down && docker-compose up -d"

# Clean up local files
echo -e "${GREEN}Cleaning up...${NC}"
rm pr-env-api.tar

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "The PR Environment API is now running at ${SERVER_HOST}:3000"
