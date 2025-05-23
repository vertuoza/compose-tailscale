#!/bin/bash

# SOPS Docker Container Entrypoint Script
# Supports multiple GCP authentication methods

set -e

# Function to display usage information
show_usage() {
    echo "SOPS Docker Container - GCP KMS Authentication"
    echo ""
    echo "Authentication Methods:"
    echo "1. Interactive Login:"
    echo "   docker run -it --entrypoint=/bin/bash sops-gcp"
    echo "   # Then run: gcloud auth login"
    echo "   # Then run: sops decrypt file.yaml"
    echo ""
    echo "Commands:"
    echo "  encrypt  - Encrypt files with authentication check (usage: encrypt [options] <file>)"
    echo "  decrypt  - Decrypt files with authentication check (usage: decrypt [options] <file>)"
    echo "  auth     - Run interactive gcloud auth login"
    echo "  bash     - Start interactive bash shell"
    echo "  help     - Show this help message"
    echo "  *        - Pass arguments directly to sops"
    echo ""
    echo "Interactive Workflow:"
    echo "  docker run -it -v /path/to/files:/workspace sops-gcp auth"
    echo "  # After authentication, you'll be in a bash shell where you can run:"
    echo "  # sops decrypt your-file.yaml"
}

# Function to ensure authentication
ensure_auth() {
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
        if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
            echo "Error: No active GCP authentication found."
            echo "Please authenticate first using one of these methods:"
            echo "1. Run interactive auth: docker run -it sops-gcp auth"
            exit 1
        fi
    else
        # Show current authentication status
        echo "Authenticated as: $(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)"
        echo "Current project: $(gcloud config get-value project 2>/dev/null || echo 'None set')"
        echo ""
    fi
}

# Handle special commands
case "${1:-}" in
    "encrypt")
        echo "SOPS Encrypt - Ensuring authentication..."
        ensure_auth

        # Shift to remove 'encrypt' from arguments
        shift

        # Check if we have arguments for the file
        if [ $# -eq 0 ]; then
            echo "Error: No file specified for encryption"
            echo "Usage: encrypt [sops-options] <file>"
            echo "Example: encrypt --input-type=binary --output-type=binary .env"
            exit 1
        fi

        echo "Encrypting with SOPS..."
        exec sops --encrypt "$@"
        ;;
    "decrypt")
        echo "SOPS Decrypt - Ensuring authentication..."
        ensure_auth

        # Shift to remove 'decrypt' from arguments
        shift

        # Check if we have arguments for the file
        if [ $# -eq 0 ]; then
            echo "Error: No file specified for decryption"
            echo "Usage: decrypt [sops-options] <file>"
            echo "Example: decrypt --input-type=binary --output-type=binary .env.enc"
            exit 1
        fi

        echo "Decrypting with SOPS..."
        exec sops --decrypt "$@"
        ;;
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
        # Pass all arguments to sops
        exec sops "$@"
        ;;
esac
