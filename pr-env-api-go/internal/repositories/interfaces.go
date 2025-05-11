package repositories

import (
	"github.com/vertuoza/pr-env-api/internal/models"
)

// EnvironmentRepository defines the interface for environment operations
type EnvironmentRepository interface {
	// Create creates a new environment
	Create(env *models.Environment) error

	// Get retrieves an environment by ID
	Get(id string) (*models.Environment, error)

	// Update updates an existing environment
	Update(env *models.Environment) error

	// List retrieves environments based on filters
	List(filters map[string]interface{}) ([]*models.Environment, error)

	// Delete marks an environment as removed
	Delete(id string) error
}

// EnvironmentLogRepository defines the interface for environment log operations
type EnvironmentLogRepository interface {
	// Create creates a new environment log
	Create(log *models.EnvironmentLog) error

	// GetByEnvironmentID retrieves logs for an environment
	GetByEnvironmentID(environmentID string) ([]*models.EnvironmentLog, error)
}
