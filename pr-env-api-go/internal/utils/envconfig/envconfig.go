package envconfig

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/vertuoza/pr-env-api/internal/config"
	"github.com/vertuoza/pr-env-api/internal/models"
	"github.com/vertuoza/pr-env-api/internal/utils/filesystem"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

// EnvironmentConfig manages environment configuration
type EnvironmentConfig struct {
	config *config.Config
}

// NewEnvironmentConfig creates a new environment config
func NewEnvironmentConfig(config *config.Config) *EnvironmentConfig {
	return &EnvironmentConfig{
		config: config,
	}
}

// CreateEnvironmentID creates an environment ID from repository name and PR number
func (c *EnvironmentConfig) CreateEnvironmentID(repositoryName string, prNumber int) string {
	return fmt.Sprintf("%s-pr-%d", repositoryName, prNumber)
}

// GetEnvironmentDir gets the environment directory path
func (c *EnvironmentConfig) GetEnvironmentDir(environmentID string) string {
	return filepath.Join(c.config.EnvsDir, environmentID)
}

// CreateEnvironmentURL creates an environment URL
func (c *EnvironmentConfig) CreateEnvironmentURL(environmentID string) string {
	return fmt.Sprintf("https://%s.%s", environmentID, c.config.TailscaleDomain)
}

// UpdateEnvironmentFiles updates environment files with PR-specific configuration
func (c *EnvironmentConfig) UpdateEnvironmentFiles(
	environmentDir string,
	repositoryName string,
	prNumber int,
	services []models.Service,
) error {
	// Create environment ID
	environmentID := c.CreateEnvironmentID(repositoryName, prNumber)

	// Update .env file if it exists
	envPath := filepath.Join(environmentDir, ".env")
	exists, err := filesystem.FileExists(envPath)
	if err != nil {
		return err
	}

	if exists {
		// Read .env file
		envContent, err := filesystem.ReadFile(envPath)
		if err != nil {
			return err
		}

		// Replace all occurrences of tailscale-subdomain with the environment ID
		envContent = strings.ReplaceAll(envContent, "tailscale-subdomain", environmentID)

		// Write updated .env file
		if err := filesystem.WriteFile(envPath, envContent); err != nil {
			return err
		}

		logger.Info("Updated .env file",
			zap.String("path", envPath),
			zap.String("subdomain", environmentID))
	}

	// Update docker-compose.yml
	composePath := filepath.Join(environmentDir, "docker-compose.yml")
	composeContent, err := filesystem.ReadFile(composePath)
	if err != nil {
		return err
	}

	// Replace all occurrences of tailscale-subdomain with the environment ID
	composeContent = strings.ReplaceAll(composeContent, "tailscale-subdomain", environmentID)

	// Parse the updated content to YAML
	var compose map[string]interface{}
	if err := yaml.Unmarshal([]byte(composeContent), &compose); err != nil {
		logger.Error("Failed to parse docker-compose.yml", err)
		return err
	}

	// Update services in the compose file
	if servicesMap, ok := compose["services"].(map[string]interface{}); ok {
		for _, service := range services {
			if serviceConfig, ok := servicesMap[service.Name].(map[string]interface{}); ok {
				serviceConfig["image"] = service.ImageURL
				logger.Info("Updated service in docker-compose.yml",
					zap.String("service", service.Name),
					zap.String("image", service.ImageURL))
			} else {
				logger.Warn("Service not found in docker-compose.yml",
					zap.String("service", service.Name))
			}
		}
	}

	// Convert back to YAML
	composeBytes, err := yaml.Marshal(compose)
	if err != nil {
		logger.Error("Failed to marshal docker-compose.yml", err)
		return err
	}

	// Write updated docker-compose.yml
	if err := filesystem.WriteFile(composePath, string(composeBytes)); err != nil {
		return err
	}

	logger.Info("Updated docker-compose.yml",
		zap.String("path", composePath),
		zap.String("subdomain", environmentID),
		zap.Int("services", len(services)))

	return nil
}
