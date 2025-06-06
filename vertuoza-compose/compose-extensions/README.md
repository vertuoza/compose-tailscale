# Docker Compose Extensions

This directory contains organized docker-compose extension files for the Vertuoza platform.

## Structure

```
compose-extensions/
├── services/                     # Service-specific overrides
│   ├── ai/                      # AI services
│   │   ├── docker-compose.ai.yml
│   │   ├── docker-compose.ai-migrations.yml
│   │   ├── docker-compose.ai-php.yml
│   │   └── docker-compose.ai-php-migrations.yml
│   ├── kernel/                  # Core kernel service
│   │   ├── docker-compose.kernel.yml
│   │   └── docker-compose.kernel-migrations.yml
│   ├── identity/                # Identity management
│   │   ├── docker-compose.identity.yml
│   │   └── docker-compose.identity-migrations.yml
│   ├── work/                    # Work management
│   │   ├── docker-compose.work.yml
│   │   └── docker-compose.work-migrations.yml
│   ├── pdf-builder/             # PDF generation service
│   │   ├── docker-compose.pdf-builder.yml
│   │   └── docker-compose.pdf-builder-migrations.yml
│   ├── electronic-invoicing/    # Electronic invoicing
│   │   ├── docker-compose.electronic-invoicing.yml
│   │   └── docker-compose.electronic-invoicing-migrations.yml
│   ├── auth/                    # Authentication service
│   │   └── docker-compose.auth.yml
│   ├── client-space/            # Client portal
│   │   └── docker-compose.client-space.yml
│   ├── vertuosoft/              # Legacy Vertuosoft
│   │   └── docker-compose.vertuosoft.yml
│   └── planning/                # Planning application
│       └── docker-compose.planning.yml
├── infrastructure/              # Infrastructure components
│   ├── docker-compose.caddy.yml     # Reverse proxy
│   ├── docker-compose.gateway.yml   # API Gateway
│   └── docker-compose.front.yml     # Frontend application
└── databases/                   # Database services
    ├── docker-compose.mysql.yml
    ├── docker-compose.postgres.yml
    └── docker-compose.postgres-db-init.yml
```

## Usage

These extension files are typically used to override specific configurations for different environments or deployment scenarios. They work in conjunction with the main `docker-compose.yml` file in the parent directory.

### Example Usage

```bash
# Use specific service extensions
docker compose -f docker-compose.yml -f compose-extensions/services/ai/docker-compose.ai.yml up

# Use multiple extensions
docker compose -f docker-compose.yml \
  -f compose-extensions/databases/docker-compose.mysql.yml \
  -f compose-extensions/services/kernel/docker-compose.kernel.yml \
  up
```

## Organization Benefits

- **Logical Grouping**: Related services and their migrations are grouped together
- **Easy Navigation**: Developers can quickly find service-specific configurations
- **Scalability**: Easy to add new services without cluttering the root directory
- **Maintainability**: Clear separation of concerns and easier file management
