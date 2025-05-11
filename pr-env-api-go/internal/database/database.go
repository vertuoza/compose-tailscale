package database

import (
	"database/sql"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
	"github.com/vertuoza/pr-env-api/internal/utils/filesystem"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// DB is the database connection
var DB *sql.DB

// Setup initializes the database connection and creates tables if they don't exist
func Setup(dbPath string) (*sql.DB, error) {
	// Ensure data directory exists
	dataDir := filepath.Dir(dbPath)
	if err := filesystem.EnsureDirectory(dataDir); err != nil {
		return nil, err
	}

	// Open database connection
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// Set connection pool settings
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	// Create tables if they don't exist
	if err := createTables(db); err != nil {
		db.Close()
		return nil, err
	}

	logger.Info("Connected to the PR environments database", zap.String("path", dbPath))
	DB = db
	return db, nil
}

// createTables creates the necessary tables if they don't exist
func createTables(db *sql.DB) error {
	// Create environments table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS environments (
			id TEXT PRIMARY KEY,
			repository_name TEXT NOT NULL,
			services_data TEXT NOT NULL,
			pr_number INTEGER NOT NULL,
			status TEXT NOT NULL,
			url TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		logger.Error("Failed to create environments table", err)
		return err
	}
	logger.Info("Environments table ready")

	// Create environment_logs table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS environment_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			environment_id TEXT NOT NULL,
			action TEXT NOT NULL,
			status TEXT NOT NULL,
			message TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (environment_id) REFERENCES environments (id)
		)
	`)
	if err != nil {
		logger.Error("Failed to create environment_logs table", err)
		return err
	}
	logger.Info("Environment logs table ready")

	return nil
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return DB
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// Transaction executes a function within a transaction
func Transaction(fn func(*sql.Tx) error) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p) // re-throw panic after rollback
		}
	}()

	if err := fn(tx); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}
