package services

import (
	"github.com/vertuoza/pr-env-api/internal/repositories"
	"github.com/vertuoza/pr-env-api/internal/services/dockercompose"
	"github.com/vertuoza/pr-env-api/internal/services/environment"
	"github.com/vertuoza/pr-env-api/internal/utils/commandexecutor"
	"github.com/vertuoza/pr-env-api/internal/utils/envconfig"
)

// Factory creates service instances
type Factory struct {
	repoFactory    *repositories.Factory
	cmdExecutor    *commandexecutor.CommandExecutor
	envConfig      *envconfig.EnvironmentConfig
}

// NewFactory creates a new service factory
func NewFactory(
	repoFactory *repositories.Factory,
	cmdExecutor *commandexecutor.CommandExecutor,
	envConfig *envconfig.EnvironmentConfig,
) *Factory {
	return &Factory{
		repoFactory: repoFactory,
		cmdExecutor: cmdExecutor,
		envConfig:   envConfig,
	}
}

// NewDockerComposeService creates a new Docker Compose service
func (f *Factory) NewDockerComposeService() DockerComposeService {
	return dockercompose.NewService(f.cmdExecutor, f.envConfig)
}

// NewEnvironmentService creates a new environment service
func (f *Factory) NewEnvironmentService() EnvironmentService {
	dockerComposeService := f.NewDockerComposeService()
	environmentRepo := f.repoFactory.NewEnvironmentRepository()
	environmentLogRepo := f.repoFactory.NewEnvironmentLogRepository()

	return environment.NewService(
		dockerComposeService,
		environmentRepo,
		environmentLogRepo,
		f.envConfig,
	)
}
