package database

import (
	"database/sql"
)

// DBInterface defines a common interface for both *sql.DB and *sql.Tx
type DBInterface interface {
	Exec(query string, args ...interface{}) (sql.Result, error)
	Query(query string, args ...interface{}) (*sql.Rows, error)
	QueryRow(query string, args ...interface{}) *sql.Row
}

// Ensure that both *sql.DB and *sql.Tx implement the DBInterface
var _ DBInterface = &sql.DB{}
var _ DBInterface = &sql.Tx{}
