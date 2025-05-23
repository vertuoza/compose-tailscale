# SOPS Docker Container with GCP KMS Support

A lightweight Docker container for using [SOPS (Secrets OPerationS)](https://github.com/mozilla/sops) with Google Cloud Platform Key Management Service (KMS).

## Features

- **Lightweight**: Based on Alpine Linux 3.19
- **SOPS v3.8.1**: Latest stable version for encryption/decryption
- **Google Cloud SDK**: Full GCP authentication support
- **Multiple Auth Methods**: Flexible authentication options
- **Security**: Runs as non-root user
- **Interactive Support**: Built-in authentication helpers

## Building the Image

```bash
docker build -f sops.Dockerfile -t sops .
```

## Authentication Methods

### 1. Interactive Login

For development and one-time use:

```bash
# Start interactive authentication
docker run -it sops-gcp auth

# Or start a bash shell and authenticate manually
docker run -it sops-gcp bash
# Then inside container: gcloud auth login
```

## Usage Examples

### Encrypting Files

```bash
# Encrypt with GCP KMS key
docker run --rm \
  -v /path/to/service-account.json:/workspace/sa.json \
  -v /path/to/files:/workspace \
  sops-gcp encrypt \
  --gcp-kms projects/PROJECT_ID/locations/LOCATION/keyRings/RING_NAME/cryptoKeys/KEY_NAME \
  secret.yaml
```

### Decrypting Files

```bash
# Decrypt file (KMS key info is stored in encrypted file)
docker run --rm \
  -v /path/to/service-account.json:/workspace/sa.json \
  -v /path/to/files:/workspace \
  sops-gcp decrypt encrypted-secret.yaml
```

### Editing Encrypted Files

```bash
# Edit encrypted file in-place
docker run -it \
  -v /path/to/service-account.json:/workspace/sa.json \
  -v /path/to/files:/workspace \
  -e EDITOR=vi \
  sops-gcp edit encrypted-secret.yaml
```

### Working with Different Formats

```bash
# JSON file
docker run --rm \
  -v /path/to/files:/workspace \
  sops-gcp decrypt secrets.json

# Environment file
docker run --rm \
  -v /path/to/files:/workspace \
  sops-gcp decrypt .env.encrypted
```

## Container Commands

The container supports several built-in commands:

- `auth` - Start interactive GCP authentication
- `bash` - Start interactive bash shell
- `help` - Show usage information
- Any other arguments are passed directly to SOPS

## Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file
- `EDITOR` - Editor for `sops edit` command (default: vi)
- `SOPS_KMS_ARN` - Default KMS key for encryption

## Docker Compose Example

```yaml
version: '3.8'
services:
  sops:
    build:
      context: .
      dockerfile: sops.Dockerfile
    volumes:
      - ./secrets:/workspace
      - ./service-account.json:/workspace/sa.json:ro
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/workspace/sa.json
    command: decrypt encrypted-secrets.yaml
```

## Security Best Practices

1. **Use Service Account Keys**: For automated environments, use service account JSON files
2. **Limit Permissions**: Grant minimal KMS permissions to service accounts
3. **Mount Read-Only**: Mount credential files as read-only when possible
4. **Avoid Build-Time Auth**: Never include credentials in Docker images
5. **Use Secrets Management**: In production, use proper secrets management systems

## Troubleshooting

### Authentication Issues

```bash
# Check current authentication status
docker run -it sops-gcp bash
gcloud auth list

# Test KMS access
gcloud kms keys list --location=LOCATION --keyring=RING_NAME --project=PROJECT_ID
```

### Permission Errors

Ensure your service account has the following IAM roles:
- `roles/cloudkms.cryptoKeyEncrypterDecrypter`
- `roles/cloudkms.viewer` (for listing keys)

### File Access Issues

```bash
# Check file permissions and ownership
docker run --rm -v /path/to/files:/workspace sops-gcp bash
ls -la /workspace/
```

## Advanced Usage

### Custom SOPS Configuration

Create a `.sops.yaml` configuration file:

```yaml
creation_rules:
  - gcp_kms: projects/PROJECT_ID/locations/LOCATION/keyRings/RING_NAME/cryptoKeys/KEY_NAME
    path_regex: \.yaml$
  - gcp_kms: projects/PROJECT_ID/locations/LOCATION/keyRings/RING_NAME/cryptoKeys/KEY_NAME
    path_regex: \.json$
```

Then mount it in the container:

```bash
docker run --rm \
  -v /path/to/.sops.yaml:/workspace/.sops.yaml:ro \
  -v /path/to/files:/workspace \
  sops-gcp encrypt secret.yaml
```

### Batch Operations

```bash
# Encrypt multiple files
for file in *.yaml; do
  docker run --rm \
    -v $(pwd):/workspace \
    -v ~/.config/gcloud:/home/sops/.config/gcloud:ro \
    sops-gcp encrypt "$file"
done
```

## Contributing

To modify or extend this container:

1. Update the Dockerfile for new dependencies
2. Modify `sops-entrypoint.sh` for new functionality
3. Test with different authentication methods
4. Update this README with new features

## License

This Docker configuration is provided as-is. SOPS and Google Cloud SDK have their own respective licenses.
