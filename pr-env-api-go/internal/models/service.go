package models

// Service represents a service in a PR environment
type Service struct {
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
}
