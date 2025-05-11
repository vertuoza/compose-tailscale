package sqlite

import (
	"database/sql"

	"github.com/vertuoza/pr-env-api/internal/models"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// EnvironmentLogRepository is a SQLite implementation of the EnvironmentLogRepository interface
type EnvironmentLogRepository struct {
	db *sql.DB
}

// NewEnvironmentLogRepository creates a new SQLite environment log repository
func NewEnvironmentLogRepository(db *sql.DB) *EnvironmentLogRepository {
	return &EnvironmentLogRepository{
		db: db,
	}
}

// Create inserts a new environment log into the database
func (r *EnvironmentLogRepository) Create(log *models.EnvironmentLog) error {
	// Insert log
	result, err := r.db.Exec(
		"INSERT INTO environment_logs (environment_id, action, status, message) VALUES (?, ?, ?, ?)",
		log.EnvironmentID, log.Action, log.Status, log.Message,
	)
	if err != nil {
		logger.Error("Failed to create environment log", err,
			zap.String("environmentId", log.EnvironmentID),
			zap.String("action", log.Action))
		return err
	}

	// Get the inserted ID
	id, err := result.LastInsertId()
	if err != nil {
		logger.Error("Failed to get last insert ID for environment log", err)
		return err
	}

	log.ID = int(id)
	logger.Info("Created environment log",
		zap.Int("id", log.ID),
		zap.String("environmentId", log.EnvironmentID),
		zap.String("action", log.Action))

	return nil
}

// GetByEnvironmentID retrieves logs for an environment
func (r *EnvironmentLogRepository) GetByEnvironmentID(environmentID string) ([]*models.EnvironmentLog, error) {
	// Execute query
	rows, err := r.db.Query(
		"SELECT id, environment_id, action, status, message, created_at FROM environment_logs WHERE environment_id = ? ORDER BY created_at DESC",
		environmentID,
	)
	if err != nil {
		logger.Error("Failed to get environment logs", err, zap.String("environmentId", environmentID))
		return nil, err
	}
	defer rows.Close()

	// Parse results
	logs := []*models.EnvironmentLog{}
	for rows.Next() {
		log := &models.EnvironmentLog{}
		err := rows.Scan(&log.ID, &log.EnvironmentID, &log.Action, &log.Status, &log.Message, &log.CreatedAt)
		if err != nil {
			logger.Error("Failed to scan environment log row", err)
			return nil, err
		}

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		logger.Error("Error iterating environment log rows", err)
		return nil, err
	}

	return logs, nil
}

// WithTransaction returns a new repository that uses the given transaction
func (r *EnvironmentLogRepository) WithTransaction(tx *sql.Tx) *EnvironmentLogRepository {
	return &EnvironmentLogRepository{
		db: tx,
	}
}
