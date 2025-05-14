package dockercompose

import (
	"fmt"
	"path/filepath"

	"github.com/vertuoza/pr-env-api/internal/models"
	"github.com/vertuoza/pr-env-api/internal/utils/commandexecutor"
	"github.com/vertuoza/pr-env-api/internal/utils/envconfig"
	"github.com/vertuoza/pr-env-api/internal/utils/filesystem"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// Service implements the DockerComposeService interface
type Service struct {
	executor *commandexecutor.CommandExecutor
	envConfig *envconfig.EnvironmentConfig
}

// NewService creates a new Docker Compose service
func NewService(executor *commandexecutor.CommandExecutor, envConfig *envconfig.EnvironmentConfig) *Service {
	return &Service{
		executor: executor,
		envConfig: envConfig,
	}
}

// SetupPrEnvironment sets up a PR environment with Docker Compose
func (s *Service) SetupPrEnvironment(repositoryName string, prNumber int, services []models.Service) (string, error) {
	// Create environment ID
	environmentID := s.envConfig.CreateEnvironmentID(repositoryName, prNumber)

	// Create environment directory
	environmentDir := s.envConfig.GetEnvironmentDir(environmentID)
	if err := filesystem.EnsureDirectory(environmentDir); err != nil {
		logger.Error("Failed to create environment directory", err,
			zap.String("directory", environmentDir))
		return "", err
	}

	// Path to the source vertuoza-compose folder
	sourceDir := filepath.Join("..", "vertuoza-compose")

	// Copy the entire vertuoza-compose folder contents directly to the environment directory
	if err := filesystem.CopyDirectory(sourceDir, environmentDir); err != nil {
		logger.Error("Failed to copy vertuoza-compose directory", err,
			zap.String("source", sourceDir),
			zap.String("destination", environmentDir))
		return "", err
	}

	// Update environment files with PR-specific configuration and multiple services
	if err := s.envConfig.UpdateEnvironmentFiles(environmentDir, repositoryName, prNumber, services); err != nil {
		logger.Error("Failed to update environment files", err,
			zap.String("directory", environmentDir))
		return "", err
	}

	logger.Info("Set up PR environment",
		zap.String("directory", environmentDir),
		zap.Int("services", len(services)))

	return environmentDir, nil
}

// StartEnvironment starts a Docker Compose environment
func (s *Service) StartEnvironment(environmentDir string) error {
	cmd := fmt.Sprintf("cd %s && docker compose up -d", environmentDir)
	_, err := s.executor.Execute(cmd)
	if err != nil {
		logger.Error("Failed to start Docker Compose environment", err,
			zap.String("directory", environmentDir))
		return err
	}

	logger.Info("Started Docker Compose environment", zap.String("directory", environmentDir))
	return nil
}

// StopEnvironment stops and removes a Docker Compose environment
func (s *Service) StopEnvironment(environmentDir string) error {
	cmd := fmt.Sprintf("cd %s && docker compose down -v --remove-orphans", environmentDir)
	_, err := s.executor.Execute(cmd)
	if err != nil {
		logger.Error("Failed to stop Docker Compose environment", err,
			zap.String("directory", environmentDir))
		return err
	}

	// Clean up any dangling containers, images, and volumes
	_, err = s.executor.Execute("docker system prune -f")
	if err != nil {
		logger.Error("Failed to prune Docker system", err)
		return err
	}

	logger.Info("Stopped Docker Compose environment", zap.String("directory", environmentDir))
	return nil
}

// CleanupEnvironment removes the environment directory
func (s *Service) CleanupEnvironment(environmentDir string) error {
	if err := filesystem.Remove(environmentDir); err != nil {
		logger.Error("Failed to clean up environment directory", err,
			zap.String("directory", environmentDir))
		return err
	}

	logger.Info("Cleaned up environment directory", zap.String("directory", environmentDir))
	return nil
}
