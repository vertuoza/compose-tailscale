#!/bin/bash

# SOPS Docker Container Entrypoint Script
# Supports multiple GCP authentication methods

set -e

# Function to display usage information
show_usage() {
    echo "SOPS Docker Container - GCP KMS Authentication"
    echo ""
    echo "Authentication Methods:"
    echo "1. Service Account Key File:"
    echo "   docker run -v /path/to/sa.json:/workspace/sa.json \\"
    echo "              -e GOOGLE_APPLICATION_CREDENTIALS=/workspace/sa.json \\"
    echo "              sops-gcp decrypt file.yaml"
    echo ""
    echo "2. Interactive Login:"
    echo "   docker run -it --entrypoint=/bin/bash sops-gcp"
    echo "   # Then run: gcloud auth login"
    echo "   # Then run: sops decrypt file.yaml"
    echo ""
    echo "3. Mount existing gcloud credentials:"
    echo "   docker run -v ~/.config/gcloud:/home/sops/.config/gcloud \\"
    echo "              sops-gcp decrypt file.yaml"
    echo ""
    echo "4. Use 'auth' command for interactive login:"
    echo "   docker run -it sops-gcp auth"
    echo ""
    echo "Commands:"
    echo "  auth     - Run interactive gcloud auth login, then start bash shell"
    echo "  bash     - Start interactive bash shell"
    echo "  help     - Show this help message"
    echo "  *        - Pass arguments directly to sops"
    echo ""
    echo "Interactive Workflow:"
    echo "  docker run -it -v /path/to/files:/workspace sops-gcp auth"
    echo "  # After authentication, you'll be in a bash shell where you can run:"
    echo "  # sops decrypt your-file.yaml"
}

# Handle special commands
case "${1:-}" in
    "auth")
        echo "Starting interactive GCP authentication..."
        echo "This will open a browser for authentication."
        echo "Make sure to run this container with -it flags for interactive mode."
        echo ""
        gcloud auth login
        echo ""
        echo "Setting up Application Default Credentials for SOPS..."
        gcloud auth application-default login
        echo ""
        echo "Authentication complete! You can now use SOPS with GCP KMS."
        echo "Example: sops decrypt your-encrypted-file.yaml"
        exec /bin/bash
        ;;
    "bash")
        echo "Starting interactive bash shell..."
        echo "Available commands: sops, gcloud"
        echo "Run 'gcloud auth login' to authenticate with GCP"
        exec /bin/bash
        ;;
    "help"|"--help"|"-h")
        show_usage
        exit 0
        ;;
    "")
        # No arguments provided, show help
        show_usage
        exit 0
        ;;
    *)
        # Check if user is authenticated
        if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
            if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
                echo "Warning: No active GCP authentication found."
                echo "Either set GOOGLE_APPLICATION_CREDENTIALS or run 'docker run -it sops-gcp auth' first."
                echo ""
            fi
        else
            # Show current authentication status
            echo "Authenticated as: $(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)"
            echo "Current project: $(gcloud config get-value project 2>/dev/null || echo 'None set')"
            echo ""
        fi

        # Pass all arguments to sops
        exec sops "$@"
        ;;
esac
