#!/bin/bash

# Script to automatically update ALLOWED_IMPERSONATION_IPS with Tailscale container IP
# This script waits for the Tailscale container to be ready and extracts its IP address

set -e

CONTAINER_NAME="tailscale-subdomain-ts"
# Detect if we're in the vertuoza-compose directory or parent directory
if [ -f ".env" ] && [ -f "docker-compose.yml" ]; then
    ENV_FILE=".env"
else
    ENV_FILE="vertuoza-compose/.env"
fi
MAX_WAIT_TIME=60
WAIT_INTERVAL=2

echo "Updating Tailscale IP in .env file..."

# Function to check if container is running and has an IP
check_container_ready() {
    local container_status
    container_status=$(docker inspect "$CONTAINER_NAME" --format='{{.State.Status}}' 2>/dev/null || echo "not_found")

    if [ "$container_status" = "not_found" ]; then
        return 2  # Container not found
    elif [ "$container_status" != "running" ]; then
        return 1  # Container exists but not running
    fi

    # Check if container has an IP address
    local ip_address
    ip_address=$(docker inspect "$CONTAINER_NAME" --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "")

    if [ -z "$ip_address" ]; then
        return 1  # Container running but no IP yet
    fi

    return 0  # Container ready with IP
}

# Function to validate IP address format
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Wait for Tailscale container to be ready
echo "Waiting for Tailscale container to be ready..."
elapsed_time=0

while [ $elapsed_time -lt $MAX_WAIT_TIME ]; do
    if check_container_ready; then
        echo "Tailscale container is ready"
        break
    fi

    container_status=$(docker inspect "$CONTAINER_NAME" --format='{{.State.Status}}' 2>/dev/null || echo "not_found")

    if [ "$container_status" = "not_found" ]; then
        echo "Error: Tailscale container '$CONTAINER_NAME' not found"
        echo "Make sure Docker Compose services are starting up"
        exit 1
    fi

    echo "Container status: $container_status, waiting..."
    sleep $WAIT_INTERVAL
    elapsed_time=$((elapsed_time + WAIT_INTERVAL))
done

# Final check after timeout
if ! check_container_ready; then
    echo "Error: Tailscale container did not become ready within $MAX_WAIT_TIME seconds"
    exit 1
fi

# Extract the Tailscale container IP
TAILSCALE_IP=$(docker inspect "$CONTAINER_NAME" --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)

if [ -z "$TAILSCALE_IP" ]; then
    echo "Error: Could not extract IP address from Tailscale container"
    exit 1
fi

# Validate the extracted IP
if ! validate_ip "$TAILSCALE_IP"; then
    echo "Error: Extracted IP address '$TAILSCALE_IP' is not valid"
    exit 1
fi

echo "Extracted Tailscale IP: $TAILSCALE_IP"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file '$ENV_FILE' not found"
    exit 1
fi

# Update the ALLOWED_IMPERSONATION_IPS variable in the .env file
# This will only modify the specific line, preserving all other content
if grep -q "^ALLOWED_IMPERSONATION_IPS=" "$ENV_FILE"; then
    # Variable exists, update it
    sed -i.bak "s/^ALLOWED_IMPERSONATION_IPS=.*/ALLOWED_IMPERSONATION_IPS=$TAILSCALE_IP/" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"  # Remove backup file
    echo "Updated ALLOWED_IMPERSONATION_IPS=$TAILSCALE_IP in $ENV_FILE"
else
    # Variable doesn't exist, add it
    echo "ALLOWED_IMPERSONATION_IPS=$TAILSCALE_IP" >> "$ENV_FILE"
    echo "Added ALLOWED_IMPERSONATION_IPS=$TAILSCALE_IP to $ENV_FILE"
fi

# Verify the update was successful
if grep -q "^ALLOWED_IMPERSONATION_IPS=$TAILSCALE_IP$" "$ENV_FILE"; then
    echo "Tailscale IP update completed successfully"
else
    echo "Error: Failed to update .env file"
    exit 1
fi
