package models

import (
	"time"
)

// EnvironmentLog represents a log entry for an environment operation
type EnvironmentLog struct {
	ID            int       `json:"id"`
	EnvironmentID string    `json:"environmentId"`
	Action        string    `json:"action"`
	Status        string    `json:"status"`
	Message       string    `json:"message"`
	CreatedAt     time.Time `json:"createdAt"`
}
