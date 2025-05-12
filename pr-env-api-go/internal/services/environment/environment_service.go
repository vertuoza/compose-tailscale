package environment

import (
	"fmt"

	"github.com/vertuoza/pr-env-api/internal/interfaces/services"
	"github.com/vertuoza/pr-env-api/internal/models"
	"github.com/vertuoza/pr-env-api/internal/repositories"
	"github.com/vertuoza/pr-env-api/internal/utils/envconfig"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// Service implements the EnvironmentService interface
type Service struct {
	dockerComposeService services.DockerComposeService
	environmentRepo      repositories.EnvironmentRepository
	environmentLogRepo   repositories.EnvironmentLogRepository
	envConfig            *envconfig.EnvironmentConfig
}

// NewService creates a new environment service
func NewService(
	dockerComposeService services.DockerComposeService,
	environmentRepo repositories.EnvironmentRepository,
	environmentLogRepo repositories.EnvironmentLogRepository,
	envConfig *envconfig.EnvironmentConfig,
) *Service {
	return &Service{
		dockerComposeService: dockerComposeService,
		environmentRepo:      environmentRepo,
		environmentLogRepo:   environmentLogRepo,
		envConfig:            envConfig,
	}
}

// CreateEnvironment creates a new PR environment
func (s *Service) CreateEnvironment(repositoryName string, prNumber int, services []models.Service) (*models.Environment, error) {
	// Create environment ID
	environmentID := s.envConfig.CreateEnvironmentID(repositoryName, prNumber)

	// Check if environment already exists
	existingEnv, err := s.environmentRepo.Get(environmentID)
	if err == nil && existingEnv != nil {
		// Environment exists, update it instead
		return s.UpdateEnvironment(repositoryName, prNumber, services)
	}

	// Set up PR environment with vertuoza-compose
	environmentDir, err := s.dockerComposeService.SetupPrEnvironment(repositoryName, prNumber, services)
	if err != nil {
		s.logEnvironmentAction(environmentID, "create", "error", err.Error())
		return nil, fmt.Errorf("failed to set up PR environment: %w", err)
	}

	// Start the environment
	if err := s.dockerComposeService.StartEnvironment(environmentDir); err != nil {
		s.logEnvironmentAction(environmentID, "create", "error", err.Error())
		return nil, fmt.Errorf("failed to start environment: %w", err)
	}

	// Create the URL for the PR environment
	url := s.envConfig.CreateEnvironmentURL(environmentID)

	// Create environment object
	env := &models.Environment{
		ID:             environmentID,
		RepositoryName: repositoryName,
		Services:       services,
		PRNumber:       prNumber,
		Status:         "running",
		URL:            url,
	}

	// Store environment in database
	if err := s.environmentRepo.Create(env); err != nil {
		s.logEnvironmentAction(environmentID, "create", "error", err.Error())
		return nil, fmt.Errorf("failed to store environment in database: %w", err)
	}

	// Log the action
	s.logEnvironmentAction(environmentID, "create", "success", fmt.Sprintf("Environment created successfully with %d services", len(services)))

	return env, nil
}

// UpdateEnvironment updates an existing PR environment
func (s *Service) UpdateEnvironment(repositoryName string, prNumber int, services []models.Service) (*models.Environment, error) {
	// Create environment ID
	environmentID := s.envConfig.CreateEnvironmentID(repositoryName, prNumber)

	// Check if environment exists
	existingEnv, err := s.environmentRepo.Get(environmentID)
	if err != nil || existingEnv == nil {
		// Environment doesn't exist, create it instead
		return s.CreateEnvironment(repositoryName, prNumber, services)
	}

	// Set up PR environment with vertuoza-compose
	environmentDir, err := s.dockerComposeService.SetupPrEnvironment(repositoryName, prNumber, services)
	if err != nil {
		s.logEnvironmentAction(environmentID, "update", "error", err.Error())
		return nil, fmt.Errorf("failed to set up PR environment: %w", err)
	}

	// Start the environment
	if err := s.dockerComposeService.StartEnvironment(environmentDir); err != nil {
		s.logEnvironmentAction(environmentID, "update", "error", err.Error())
		return nil, fmt.Errorf("failed to start environment: %w", err)
	}

	// Create the URL for the PR environment
	url := s.envConfig.CreateEnvironmentURL(environmentID)

	// Update environment object
	existingEnv.RepositoryName = repositoryName
	existingEnv.Services = services
	existingEnv.Status = "running"
	existingEnv.URL = url

	// Update environment in database
	if err := s.environmentRepo.Update(existingEnv); err != nil {
		s.logEnvironmentAction(environmentID, "update", "error", err.Error())
		return nil, fmt.Errorf("failed to update environment in database: %w", err)
	}

	// Log the action
	s.logEnvironmentAction(environmentID, "update", "success", fmt.Sprintf("Environment updated successfully with %d services", len(services)))

	return existingEnv, nil
}

// RemoveEnvironment removes a PR environment
func (s *Service) RemoveEnvironment(repositoryName string, prNumber int) (*models.Environment, error) {
	// Create environment ID
	environmentID := s.envConfig.CreateEnvironmentID(repositoryName, prNumber)

	// Check if environment exists
	existingEnv, err := s.environmentRepo.Get(environmentID)
	if err != nil || existingEnv == nil {
		return nil, fmt.Errorf("environment %s not found", environmentID)
	}

	// Get the environment directory
	environmentDir := s.envConfig.GetEnvironmentDir(environmentID)

	// Stop and remove the environment
	if err := s.dockerComposeService.StopEnvironment(environmentDir); err != nil {
		s.logEnvironmentAction(environmentID, "remove", "error", err.Error())
		return nil, fmt.Errorf("failed to stop environment: %w", err)
	}

	// Update environment status in database
	existingEnv.Status = "removed"
	if err := s.environmentRepo.Update(existingEnv); err != nil {
		s.logEnvironmentAction(environmentID, "remove", "error", err.Error())
		return nil, fmt.Errorf("failed to update environment status in database: %w", err)
	}

	// Log the action
	s.logEnvironmentAction(environmentID, "remove", "success", "Environment removed successfully")

	// Clean up environment directory
	if err := s.dockerComposeService.CleanupEnvironment(environmentDir); err != nil {
		logger.Warn("Failed to clean up environment directory", zap.String("directory", environmentDir), zap.Error(err))
	}

	return &models.Environment{
		ID:             environmentID,
		RepositoryName: repositoryName,
		Status:         "removed",
	}, nil
}

// GetEnvironment retrieves an environment by ID
func (s *Service) GetEnvironment(id string) (*models.Environment, error) {
	env, err := s.environmentRepo.Get(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get environment: %w", err)
	}

	return env, nil
}

// ListEnvironments retrieves environments based on filters
func (s *Service) ListEnvironments(filters map[string]interface{}) ([]*models.Environment, error) {
	environments, err := s.environmentRepo.List(filters)
	if err != nil {
		return nil, fmt.Errorf("failed to list environments: %w", err)
	}

	return environments, nil
}

// GetEnvironmentLogs retrieves logs for an environment
func (s *Service) GetEnvironmentLogs(environmentID string) ([]*models.EnvironmentLog, error) {
	logs, err := s.environmentLogRepo.GetByEnvironmentID(environmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get environment logs: %w", err)
	}

	return logs, nil
}

// logEnvironmentAction logs an environment action
func (s *Service) logEnvironmentAction(environmentID, action, status, message string) {
	log := &models.EnvironmentLog{
		EnvironmentID: environmentID,
		Action:        action,
		Status:        status,
		Message:       message,
	}

	if err := s.environmentLogRepo.Create(log); err != nil {
		logger.Error("Failed to create environment log", err,
			zap.String("environmentId", environmentID),
			zap.String("action", action))
	}
}
