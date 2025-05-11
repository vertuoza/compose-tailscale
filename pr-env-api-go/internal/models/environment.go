package models

import (
	"encoding/json"
	"time"
)

// Environment represents a PR environment
type Environment struct {
	ID             string    `json:"id"`
	RepositoryName string    `json:"repositoryName"`
	ServicesData   string    `json:"-"`
	Services       []Service `json:"services"`
	PRNumber       int       `json:"prNumber"`
	Status         string    `json:"status"`
	URL            string    `json:"url"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// UnmarshalServices parses the ServicesData JSON into the Services slice
func (e *Environment) UnmarshalServices() error {
	if e.ServicesData == "" {
		e.Services = []Service{}
		return nil
	}

	return json.Unmarshal([]byte(e.ServicesData), &e.Services)
}

// MarshalServices converts the Services slice to JSON and stores it in ServicesData
func (e *Environment) MarshalServices() error {
	data, err := json.Marshal(e.Services)
	if err != nil {
		return err
	}

	e.ServicesData = string(data)
	return nil
}
