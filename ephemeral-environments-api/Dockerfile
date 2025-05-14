FROM node:20-alpine

# Install Docker CLI, Docker Compose, and dependencies for Google Cloud SDK
RUN apk add --no-cache docker docker-compose curl python3 py3-pip bash

# Install Google Cloud SDK
RUN curl -sSL https://sdk.cloud.google.com > /tmp/gcl && \
    bash /tmp/gcl --install-dir=/usr/local --disable-prompts && \
    rm -rf /tmp/gcl

# Add gcloud to PATH
ENV PATH $PATH:/usr/local/google-cloud-sdk/bin

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create data and logs directories
RUN mkdir -p data/environments logs

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]
