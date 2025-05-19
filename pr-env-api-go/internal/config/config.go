package config

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port            string
	Environment     string
	TailscaleDomain string
	TailscaleAuthKey string
	DBPath          string
	LogLevel        string
	DataDir         string
	EnvsDir         string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	// Set default data directory
	dataDir := getEnv("DATA_DIR", "./data")

	return &Config{
		Port:            getEnv("PORT", "3000"),
		Environment:     getEnv("NODE_ENV", "development"),
		TailscaleDomain: getEnv("TAILSCALE_DOMAIN", "tailf31c84.ts.net"),
		TailscaleAuthKey: getEnv("TAILSCALE_AUTH_KEY", ""),
		DBPath:          getEnv("DB_PATH", filepath.Join(dataDir, "pr-environments.db")),
		LogLevel:        getEnv("LOG_LEVEL", "info"),
		DataDir:         dataDir,
		EnvsDir:         filepath.Join(dataDir, "environments"),
	}, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
