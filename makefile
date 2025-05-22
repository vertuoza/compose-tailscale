default: sops-decrypt docker-start

down: docker-stop

sops-encrypt:
	sops encrypt --input-type=binary --output-type=binary --gcp-kms "projects/vertuoza-qa/locations/global/keyRings/sops/cryptoKeys/sops-key" .env > .env.enc
	cd vertuoza-compose && sops encrypt --input-type=binary --output-type=binary --gcp-kms "projects/vertuoza-qa/locations/global/keyRings/sops/cryptoKeys/sops-key" .env > .env.enc

sops-decrypt:
	sops decrypt --input-type=binary --output-type=binary .env.enc > .env
	cd vertuoza-compose && sops decrypt --input-type=binary --output-type=binary .env.enc > .env

docker-start:
	docker compose pull
	docker compose up -d

docker-stop:
	docker compose down
