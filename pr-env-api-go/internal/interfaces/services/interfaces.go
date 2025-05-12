package services

import (
	"github.com/vertuoza/pr-env-api/internal/models"
)

// DockerComposeService defines the interface for Docker Compose operations
type DockerComposeService interface {
	// SetupPrEnvironment sets up a PR environment with Docker Compose
	SetupPrEnvironment(repositoryName string, prNumber int, services []models.Service) (string, error)

	// StartEnvironment starts a Docker Compose environment
	StartEnvironment(environmentDir string) error

	// StopEnvironment stops and removes a Docker Compose environment
	StopEnvironment(environmentDir string) error

	// CleanupEnvironment removes the environment directory
	CleanupEnvironment(environmentDir string) error
}

// EnvironmentService defines the interface for environment management
type EnvironmentService interface {
	// CreateEnvironment creates a new PR environment
	CreateEnvironment(repositoryName string, prNumber int, services []models.Service) (*models.Environment, error)

	// UpdateEnvironment updates an existing PR environment
	UpdateEnvironment(repositoryName string, prNumber int, services []models.Service) (*models.Environment, error)

	// RemoveEnvironment removes a PR environment
	RemoveEnvironment(repositoryName string, prNumber int) (*models.Environment, error)

	// GetEnvironment retrieves an environment by ID
	GetEnvironment(id string) (*models.Environment, error)

	// ListEnvironments retrieves environments based on filters
	ListEnvironments(filters map[string]interface{}) ([]*models.Environment, error)

	// GetEnvironmentLogs retrieves logs for an environment
	GetEnvironmentLogs(environmentID string) ([]*models.EnvironmentLog, error)
}
