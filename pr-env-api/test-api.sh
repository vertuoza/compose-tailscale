#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
API_URL="http://localhost:3000"
ACTION=""
SERVICE_NAME=""
PR_NUMBER=""
IMAGE_URL=""

# Function to display usage
function usage {
    echo -e "${BLUE}Usage:${NC} $0 [options]"
    echo -e ""
    echo -e "${BLUE}Options:${NC}"
    echo -e "  -u, --url URL         API URL (default: http://localhost:3000)"
    echo -e "  -a, --action ACTION   Action to perform (create-env, update-env, remove-env, list-envs, get-env, get-logs)"
    echo -e "  -s, --service SERVICE Service name (required for env actions)"
    echo -e "  -p, --pr PR_NUMBER    PR number (required for env actions)"
    echo -e "  -i, --image IMAGE_URL Docker image URL (required for create-env and update-env)"
    echo -e "  -h, --help            Display this help message"
    echo -e ""
    echo -e "${BLUE}Examples:${NC}"
    echo -e "  $0 --action create-env --service kernel --pr 123 --image europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123"
    echo -e "  $0 --action update-env --service kernel --pr 123 --image europe-west1-docker.pkg.dev/vertuoza-qa/vertuoza/kernel:pr-123-updated"
    echo -e "  $0 --action remove-env --service kernel --pr 123"
    echo -e "  $0 --action list-envs"
    echo -e "  $0 --action get-env --service kernel --pr 123"
    echo -e "  $0 --action get-logs --service kernel --pr 123"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -u|--url)
            API_URL="$2"
            shift
            shift
            ;;
        -a|--action)
            ACTION="$2"
            shift
            shift
            ;;
        -s|--service)
            SERVICE_NAME="$2"
            shift
            shift
            ;;
        -p|--pr)
            PR_NUMBER="$2"
            shift
            shift
            ;;
        -i|--image)
            IMAGE_URL="$2"
            shift
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Check if action is provided
if [ -z "$ACTION" ]; then
    echo -e "${RED}Error: Action is required${NC}"
    usage
fi

# Function to create an environment
function create_env {
    # Check if service name is provided
    if [ -z "$SERVICE_NAME" ]; then
        echo -e "${RED}Error: Service name is required${NC}"
        usage
    fi

    # Check if PR number is provided
    if [ -z "$PR_NUMBER" ]; then
        echo -e "${RED}Error: PR number is required${NC}"
        usage
    fi

    # Check if image URL is provided
    if [ -z "$IMAGE_URL" ]; then
        echo -e "${RED}Error: Image URL is required${NC}"
        usage
    fi

    echo -e "${BLUE}Creating environment...${NC}"
    curl -s -X POST "$API_URL/api/environments" \
        -H "Content-Type: application/json" \
        -d '{
            "service_name": "'"$SERVICE_NAME"'",
            "pr_number": '"$PR_NUMBER"',
            "image_url": "'"$IMAGE_URL"'",
            "config": {
                "environment": [
                    "FEATURE_FLAG_NEW_UI=true",
                    "DEBUG_LEVEL=verbose"
                ]
            }
        }' | jq .
}

# Function to update an environment
function update_env {
    # Check if service name is provided
    if [ -z "$SERVICE_NAME" ]; then
        echo -e "${RED}Error: Service name is required${NC}"
        usage
    fi

    # Check if PR number is provided
    if [ -z "$PR_NUMBER" ]; then
        echo -e "${RED}Error: PR number is required${NC}"
        usage
    fi

    # Check if image URL is provided
    if [ -z "$IMAGE_URL" ]; then
        echo -e "${RED}Error: Image URL is required${NC}"
        usage
    fi

    echo -e "${BLUE}Updating environment...${NC}"
    curl -s -X PUT "$API_URL/api/environments/$SERVICE_NAME-pr-$PR_NUMBER" \
        -H "Content-Type: application/json" \
        -d '{
            "image_url": "'"$IMAGE_URL"'",
            "config": {
                "environment": [
                    "FEATURE_FLAG_NEW_UI=true",
                    "DEBUG_LEVEL=debug"
                ]
            }
        }' | jq .
}

# Function to remove an environment
function remove_env {
    # Check if service name is provided
    if [ -z "$SERVICE_NAME" ]; then
        echo -e "${RED}Error: Service name is required${NC}"
        usage
    fi

    # Check if PR number is provided
    if [ -z "$PR_NUMBER" ]; then
        echo -e "${RED}Error: PR number is required${NC}"
        usage
    fi

    echo -e "${BLUE}Removing environment...${NC}"
    curl -s -X DELETE "$API_URL/api/environments/$SERVICE_NAME-pr-$PR_NUMBER" | jq .
}

# Function to list environments
function list_envs {
    echo -e "${BLUE}Listing environments...${NC}"
    curl -s -X GET "$API_URL/api/environments" | jq .
}

# Function to get environment details
function get_env {
    # Check if service name is provided
    if [ -z "$SERVICE_NAME" ]; then
        echo -e "${RED}Error: Service name is required${NC}"
        usage
    fi

    # Check if PR number is provided
    if [ -z "$PR_NUMBER" ]; then
        echo -e "${RED}Error: PR number is required${NC}"
        usage
    fi

    echo -e "${BLUE}Getting environment details...${NC}"
    curl -s -X GET "$API_URL/api/environments/$SERVICE_NAME-pr-$PR_NUMBER" | jq .
}

# Function to get environment logs
function get_logs {
    # Check if service name is provided
    if [ -z "$SERVICE_NAME" ]; then
        echo -e "${RED}Error: Service name is required${NC}"
        usage
    fi

    # Check if PR number is provided
    if [ -z "$PR_NUMBER" ]; then
        echo -e "${RED}Error: PR number is required${NC}"
        usage
    fi

    echo -e "${BLUE}Getting environment logs...${NC}"
    curl -s -X GET "$API_URL/api/environments/$SERVICE_NAME-pr-$PR_NUMBER/logs" | jq .
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Output will not be formatted.${NC}"
    JQ_INSTALLED=false
else
    JQ_INSTALLED=true
fi

# Execute the requested action
case $ACTION in
    create-env)
        create_env
        ;;
    update-env)
        update_env
        ;;
    remove-env)
        remove_env
        ;;
    list-envs)
        list_envs
        ;;
    get-env)
        get_env
        ;;
    get-logs)
        get_logs
        ;;
    *)
        echo -e "${RED}Error: Unknown action: $ACTION${NC}"
        usage
        ;;
esac
