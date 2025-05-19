package repositories

import (
	"database/sql"

	"github.com/vertuoza/pr-env-api/internal/repositories/sqlite"
)

// Factory creates repository instances
type Factory struct {
	db *sql.DB
}

// NewFactory creates a new repository factory
func NewFactory(db *sql.DB) *Factory {
	return &Factory{
		db: db,
	}
}

// NewEnvironmentRepository creates a new environment repository
func (f *Factory) NewEnvironmentRepository() EnvironmentRepository {
	return sqlite.NewEnvironmentRepository(f.db)
}

// NewEnvironmentLogRepository creates a new environment log repository
func (f *Factory) NewEnvironmentLogRepository() EnvironmentLogRepository {
	return sqlite.NewEnvironmentLogRepository(f.db)
}
