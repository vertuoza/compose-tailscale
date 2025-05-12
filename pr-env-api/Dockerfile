FROM node:20-alpine

# Install Docker CLI and Docker Compose
RUN apk add --no-cache docker docker-compose

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
