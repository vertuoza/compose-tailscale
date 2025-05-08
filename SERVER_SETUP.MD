Dokploy
```
curl -sSL https://dokploy.com/install.sh | sh
```

Tailscale
```
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```

Docker
```
docker login ghcr.io
```

Gcloud
```
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates gnupg curl
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get update && sudo apt-get install -y google-cloud-cli
gcloud init
gcloud auth login
gcloud config set project vertuoza-qa
gcloud auth application-default login
gcloud auth application-default set-quota-project vertuoza-qa
gcloud auth configure-docker europe-west1-docker.pkg.dev
```