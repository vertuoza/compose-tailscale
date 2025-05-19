package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/vertuoza/pr-env-api/internal/config"
	"github.com/vertuoza/pr-env-api/internal/database"
	"github.com/vertuoza/pr-env-api/internal/handlers"
	"github.com/vertuoza/pr-env-api/internal/repositories"
	"github.com/vertuoza/pr-env-api/internal/services"
	"github.com/vertuoza/pr-env-api/internal/utils/commandexecutor"
	"github.com/vertuoza/pr-env-api/internal/utils/envconfig"
	"github.com/vertuoza/pr-env-api/internal/utils/filesystem"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		os.Exit(1)
	}

	// Initialize logger
	logger.Setup(cfg.LogLevel)

	// Initialize utilities
	cmdExecutor := commandexecutor.NewCommandExecutor(5 * time.Minute)
	envConfig := envconfig.NewEnvironmentConfig(cfg)

	// Ensure data directories exist
	if err := filesystem.EnsureDirectory(cfg.DataDir); err != nil {
		logger.Fatal("Failed to create data directory")
	}

	if err := filesystem.EnsureDirectory(cfg.EnvsDir); err != nil {
		logger.Fatal("Failed to create environments directory")
	}

	// Initialize database
	db, err := database.Setup(cfg.DBPath)
	if err != nil {
		logger.Fatal("Failed to set up database", zap.Error(err))
	}
	defer database.Close()

	// Initialize repositories
	repoFactory := repositories.NewFactory(db)

	// Initialize services
	serviceFactory := services.NewFactory(repoFactory, cmdExecutor, envConfig)

	// Set up HTTP server and routes
	router := handlers.SetupRouter(serviceFactory)

	// Create HTTP server
	port := cfg.Port
	if port == "" {
		port = "3000" // Default port
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.Info(fmt.Sprintf("PR Environment API Server started on port %s", port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exiting")

	// Clean up resources
	logger.Sync()
}
