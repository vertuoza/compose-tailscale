# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o pr-env-api ./cmd/server/main.go

# Final stage
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata docker-cli

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/pr-env-api .

# Copy configuration files
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/api ./api

# Create data directory
RUN mkdir -p /app/data

# Expose the port
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/app/pr-env-api"]
