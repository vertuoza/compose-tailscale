package sqlite

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/vertuoza/pr-env-api/internal/database"
	"github.com/vertuoza/pr-env-api/internal/models"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// EnvironmentRepository is a SQLite implementation of the EnvironmentRepository interface
type EnvironmentRepository struct {
	db database.DBInterface
}

// NewEnvironmentRepository creates a new SQLite environment repository
func NewEnvironmentRepository(db database.DBInterface) *EnvironmentRepository {
	return &EnvironmentRepository{
		db: db,
	}
}

// Create inserts a new environment into the database
func (r *EnvironmentRepository) Create(env *models.Environment) error {
	// Marshal services to JSON
	if err := env.MarshalServices(); err != nil {
		return err
	}

	// Set timestamps
	now := time.Now()
	env.CreatedAt = now
	env.UpdatedAt = now

	// Insert environment
	_, err := r.db.Exec(
		"INSERT INTO environments (id, repository_name, services_data, pr_number, status, url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		env.ID, env.RepositoryName, env.ServicesData, env.PRNumber, env.Status, env.URL, env.CreatedAt, env.UpdatedAt,
	)
	if err != nil {
		logger.Error("Failed to create environment", err, zap.String("id", env.ID))
		return err
	}

	logger.Info("Created environment", zap.String("id", env.ID))
	return nil
}

// Get retrieves an environment by ID
func (r *EnvironmentRepository) Get(id string) (*models.Environment, error) {
	env := &models.Environment{}

	err := r.db.QueryRow(
		"SELECT id, repository_name, services_data, pr_number, status, url, created_at, updated_at FROM environments WHERE id = ?",
		id,
	).Scan(&env.ID, &env.RepositoryName, &env.ServicesData, &env.PRNumber, &env.Status, &env.URL, &env.CreatedAt, &env.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("environment %s not found", id)
		}
		logger.Error("Failed to get environment", err, zap.String("id", id))
		return nil, err
	}

	// Unmarshal services from JSON
	if err := env.UnmarshalServices(); err != nil {
		return nil, err
	}

	return env, nil
}

// Update updates an existing environment
func (r *EnvironmentRepository) Update(env *models.Environment) error {
	// Marshal services to JSON
	if err := env.MarshalServices(); err != nil {
		return err
	}

	// Update timestamp
	env.UpdatedAt = time.Now()

	// Update environment
	_, err := r.db.Exec(
		"UPDATE environments SET repository_name = ?, services_data = ?, status = ?, url = ?, updated_at = ? WHERE id = ?",
		env.RepositoryName, env.ServicesData, env.Status, env.URL, env.UpdatedAt, env.ID,
	)
	if err != nil {
		logger.Error("Failed to update environment", err, zap.String("id", env.ID))
		return err
	}

	logger.Info("Updated environment", zap.String("id", env.ID))
	return nil
}

// List retrieves environments based on filters
func (r *EnvironmentRepository) List(filters map[string]interface{}) ([]*models.Environment, error) {
	// Build query with filters
	query := "SELECT id, repository_name, services_data, pr_number, status, url, created_at, updated_at FROM environments"
	args := []interface{}{}
	whereConditions := []string{}

	if status, ok := filters["status"].(string); ok && status != "" {
		whereConditions = append(whereConditions, "status = ?")
		args = append(args, status)
	}

	if prNumber, ok := filters["prNumber"].(int); ok && prNumber > 0 {
		whereConditions = append(whereConditions, "pr_number = ?")
		args = append(args, prNumber)
	}

	if repoName, ok := filters["repositoryName"].(string); ok && repoName != "" {
		whereConditions = append(whereConditions, "repository_name = ?")
		args = append(args, repoName)
	}

	if len(whereConditions) > 0 {
		query += " WHERE " + strings.Join(whereConditions, " AND ")
	}

	query += " ORDER BY created_at DESC"

	// Execute query
	rows, err := r.db.Query(query, args...)
	if err != nil {
		logger.Error("Failed to list environments", err)
		return nil, err
	}
	defer rows.Close()

	// Parse results
	environments := []*models.Environment{}
	for rows.Next() {
		env := &models.Environment{}
		err := rows.Scan(&env.ID, &env.RepositoryName, &env.ServicesData, &env.PRNumber, &env.Status, &env.URL, &env.CreatedAt, &env.UpdatedAt)
		if err != nil {
			logger.Error("Failed to scan environment row", err)
			return nil, err
		}

		// Unmarshal services from JSON
		if err := env.UnmarshalServices(); err != nil {
			return nil, err
		}

		environments = append(environments, env)
	}

	if err := rows.Err(); err != nil {
		logger.Error("Error iterating environment rows", err)
		return nil, err
	}

	return environments, nil
}

// Delete marks an environment as removed
func (r *EnvironmentRepository) Delete(id string) error {
	// Update environment status to 'removed'
	_, err := r.db.Exec(
		"UPDATE environments SET status = ?, updated_at = ? WHERE id = ?",
		"removed", time.Now(), id,
	)
	if err != nil {
		logger.Error("Failed to delete environment", err, zap.String("id", id))
		return err
	}

	logger.Info("Deleted environment", zap.String("id", id))
	return nil
}

// WithTransaction returns a new repository that uses the given transaction
func (r *EnvironmentRepository) WithTransaction(tx *sql.Tx) *EnvironmentRepository {
	return &EnvironmentRepository{
		db: tx,
	}
}

// ExecuteInTransaction executes a function within a transaction
func (r *EnvironmentRepository) ExecuteInTransaction(fn func(*EnvironmentRepository) error) error {
	return database.Transaction(func(tx *sql.Tx) error {
		return fn(r.WithTransaction(tx))
	})
}
