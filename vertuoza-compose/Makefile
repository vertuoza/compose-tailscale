# SOPS Docker image name
SOPS_IMAGE = ghcr.io/vertuoza/tools/sops:latest
GCP_KMS = projects/vertuoza-qa/locations/global/keyRings/sops/cryptoKeys/sops-key

default: sops-decrypt docker-start

down: docker-stop

# Function to run SOPS command - checks for existing container first
define run_sops
	@if docker ps -a --format "table {{.Names}}" | grep -qE "^sops$$"; then \
		echo "Using existing 'sops' container..."; \
	else \
		echo "Running 'sops' image..."; \
		docker run \
			-v ..:/workspace \
			-w /workspace \
			--name=sops \
			-it $(SOPS_IMAGE) auth; \
	fi; \
	docker start sops > /dev/null; \
	docker exec -it sops sops $(1);
endef

# Encrypt .env files using Docker container
sops-encrypt:
	@echo "Encrypting .env files using Docker container..."
	$(call run_sops,encrypt --input-type=binary --output-type=binary --gcp-kms $(GCP_KMS) .env > .env.enc)
	@docker stop sops > /dev/null

# Decrypt .env files using Docker container
sops-decrypt:
	@echo "Decrypting .env files using Docker container..."
	$(call run_sops,decrypt --input-type=binary --output-type=binary .env.enc > .env)
	@docker stop sops > /dev/null

docker-start:
	docker compose pull
	docker compose up -d
	$(MAKE) update-tailscale-ip

docker-stop:
	docker compose down

# Update Tailscale IP in .env file
update-tailscale-ip:
	@../scripts/update-tailscale-ip.sh

# Help target
help:
	@echo "Available targets:"
	@echo "  default          - Decrypt files and start services"
	@echo "  sops-encrypt     - Encrypt .env files"
	@echo "  sops-decrypt     - Decrypt .env files"
	@echo "  docker-start     - Start Docker services and update Tailscale IP"
	@echo "  docker-stop      - Stop Docker services"
	@echo "  update-tailscale-ip - Update Tailscale IP in .env file"
	@echo "  down             - Alias for docker-stop"
	@echo "  help             - Show this help message"
	@echo ""
	@echo "Note: SOPS commands will use existing 'sops' container if available,"
	@echo "      otherwise will run the 'sops' image from registry."
	@echo "      This Makefile is designed to work from the vertuoza-compose/ directory."

.PHONY: default down sops-encrypt sops-decrypt docker-start docker-stop update-tailscale-ip help
