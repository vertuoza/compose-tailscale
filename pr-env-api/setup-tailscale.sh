#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Setting up Tailscale for PR Environment API Server ===${NC}"
echo ""

# Check if Tailscale is installed
if ! command -v tailscale &> /dev/null; then
    echo -e "${RED}Tailscale is not installed. Please install Tailscale first.${NC}"
    exit 1
fi

# Get Tailscale config path from .env or use default
if [ -f .env ]; then
    source .env
    TAILSCALE_CONFIG_PATH=${TAILSCALE_CONFIG_PATH:-../config/vertuoza-platform.json}
    TAILSCALE_DOMAIN=${TAILSCALE_DOMAIN:-tailf31c84.ts.net}
else
    TAILSCALE_CONFIG_PATH="../config/vertuoza-platform.json"
    TAILSCALE_DOMAIN="tailf31c84.ts.net"
fi

echo -e "${BLUE}Using Tailscale config at: ${TAILSCALE_CONFIG_PATH}${NC}"
echo -e "${BLUE}Using Tailscale domain: ${TAILSCALE_DOMAIN}${NC}"

# Check if the config file exists
if [ ! -f "$TAILSCALE_CONFIG_PATH" ]; then
    echo -e "${RED}Tailscale config file not found at: ${TAILSCALE_CONFIG_PATH}${NC}"
    exit 1
fi

# Add the PR Environment API Server to the Tailscale config
echo -e "${BLUE}Adding PR Environment API Server to Tailscale config...${NC}"

# Read the current config
CONFIG=$(cat "$TAILSCALE_CONFIG_PATH")

# Check if the PR Environment API Server is already in the config
if echo "$CONFIG" | grep -q "pr-env-api.${TAILSCALE_DOMAIN}"; then
    echo -e "${YELLOW}PR Environment API Server is already in the Tailscale config.${NC}"
else
    # Add the PR Environment API Server to the config
    # First, parse the JSON
    CONFIG_TEMP=$(mktemp)
    echo "$CONFIG" > "$CONFIG_TEMP"

    # Use jq if available, otherwise use a simple sed approach
    if command -v jq &> /dev/null; then
        jq --arg domain "pr-env-api.${TAILSCALE_DOMAIN}:443" '.Web[$domain] = {"Handlers": {"/": {"Proxy": "http://pr-env-api:3000"}}}' "$CONFIG_TEMP" > "$CONFIG_TEMP.2"
        jq --arg domain "pr-env-api.${TAILSCALE_DOMAIN}:443" '.AllowFunnel[$domain] = false' "$CONFIG_TEMP.2" > "$CONFIG_TEMP.3"
        mv "$CONFIG_TEMP.3" "$TAILSCALE_CONFIG_PATH"
    else
        # Simple sed approach (less reliable but doesn't require jq)
        # Add to Web section
        sed -i 's/"Web": {/"Web": {\n    "pr-env-api.'"${TAILSCALE_DOMAIN}"':443": {\n      "Handlers": {\n        "\/": {\n          "Proxy": "http:\/\/pr-env-api:3000"\n        }\n      }\n    },/g' "$TAILSCALE_CONFIG_PATH"

        # Add to AllowFunnel section
        sed -i 's/"AllowFunnel": {/"AllowFunnel": {\n    "pr-env-api.'"${TAILSCALE_DOMAIN}"':443": false,/g' "$TAILSCALE_CONFIG_PATH"
    fi

    echo -e "${GREEN}Added PR Environment API Server to Tailscale config.${NC}"
fi

# Restart Tailscale to apply the changes
echo -e "${BLUE}Restarting Tailscale to apply changes...${NC}"
docker restart vertuoza-platform-ts

echo -e "${GREEN}Tailscale configuration updated!${NC}"
echo -e "${BLUE}You can now access the PR Environment API Server at:${NC} https://pr-env-api.${TAILSCALE_DOMAIN}"
