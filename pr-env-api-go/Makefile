.PHONY: build run test test-coverage clean lint help

# Variables
BINARY_NAME=pr-env-api
BUILD_DIR=./build
MAIN_FILE=./cmd/server/main.go
COVERAGE_FILE=coverage.out

# Default target
.DEFAULT_GOAL := help

# Build the application
build: ## Build the application
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_FILE)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Run the application
run: ## Run the application
	@echo "Running $(BINARY_NAME)..."
	@go run $(MAIN_FILE)

# Run tests
test: ## Run tests
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@go test -coverprofile=$(COVERAGE_FILE) ./...
	@go tool cover -html=$(COVERAGE_FILE)
	@rm $(COVERAGE_FILE)

# Clean build artifacts
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@go clean
	@echo "Clean complete"

# Lint the code
lint: ## Lint the code
	@echo "Linting code..."
	@golangci-lint run ./...

# Format the code
fmt: ## Format the code
	@echo "Formatting code..."
	@go fmt ./...

# Tidy dependencies
tidy: ## Tidy dependencies
	@echo "Tidying dependencies..."
	@go mod tidy

# Generate Swagger documentation
swagger: ## Generate Swagger documentation
	@echo "Swagger documentation is available at ./api/swagger.yaml"

# Help target
help: ## Display this help
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
