include sops.mk

sops.mk:
	@echo "Downloading sops.mk..."
	@mkdir -p sops_tmp
	@cd sops_tmp && \
		git init && \
		git remote add origin git@github.com:vertuoza/vertuo-actions.git && \
		git config core.sparseCheckout true && \
		echo "sops/Makefile" >> .git/info/sparse-checkout && \
		git pull origin feature/shared-makefile && \
		cp sops/Makefile ../sops.mk && \
		cd .. && rm -rf sops_tmp

sops-clean: shared-sops-clean
sops-encrypt: shared-sops-encrypt
	@echo "Encrypting vertuoza-compose/.env files using Docker container..."
	$(call run_sops,encrypt --input-type binary --output-type json --gcp-kms $(GCP_KMS) vertuoza-compose/.env > vertuoza-compose/.env.encrypted)
	@docker stop sops > /dev/null
sops-decrypt: shared-sops-decrypt
	@echo "Decrypting vertuoza-compose/.env files using Docker container..."
	$(call run_sops,decrypt --input-type json --output-type binary vertuoza-compose/.env.encrypted > vertuoza-compose/$$OUTPUT)
	@docker stop sops > /dev/null

docker-start:
	docker compose pull
	docker compose up -d
	$(MAKE) update-tailscale-ip

docker-stop:
	docker compose down

# Update Tailscale IP in .env file
update-tailscale-ip:
	@./scripts/update-tailscale-ip.sh

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

.PHONY: default down sops-encrypt sops-decrypt docker-start docker-stop update-tailscale-ip help
