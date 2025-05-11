package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestEnvironment_MarshalServices(t *testing.T) {
	// Create test environment with services
	env := &Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		PRNumber:       123,
		Status:         "running",
		URL:            "https://test-repo-pr-123.example.com",
		Services: []Service{
			{
				Name:     "service1",
				ImageURL: "image1:latest",
			},
			{
				Name:     "service2",
				ImageURL: "image2:latest",
			},
		},
	}

	// Test marshaling services
	if err := env.MarshalServices(); err != nil {
		t.Errorf("MarshalServices failed: %v", err)
	}

	// Check if services were marshaled correctly
	if env.ServicesData == "" {
		t.Errorf("ServicesData is empty after marshaling")
	}

	// Verify the marshaled data
	var services []Service
	if err := json.Unmarshal([]byte(env.ServicesData), &services); err != nil {
		t.Errorf("Failed to unmarshal services data: %v", err)
	}

	if len(services) != 2 {
		t.Errorf("Expected 2 services, got %d", len(services))
	}

	if services[0].Name != "service1" || services[0].ImageURL != "image1:latest" {
		t.Errorf("First service data is incorrect: %+v", services[0])
	}

	if services[1].Name != "service2" || services[1].ImageURL != "image2:latest" {
		t.Errorf("Second service data is incorrect: %+v", services[1])
	}
}

func TestEnvironment_UnmarshalServices(t *testing.T) {
	// Create test environment with marshaled services
	servicesData := `[{"name":"service1","image_url":"image1:latest"},{"name":"service2","image_url":"image2:latest"}]`
	env := &Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		PRNumber:       123,
		Status:         "running",
		URL:            "https://test-repo-pr-123.example.com",
		ServicesData:   servicesData,
	}

	// Test unmarshaling services
	if err := env.UnmarshalServices(); err != nil {
		t.Errorf("UnmarshalServices failed: %v", err)
	}

	// Check if services were unmarshaled correctly
	if len(env.Services) != 2 {
		t.Errorf("Expected 2 services, got %d", len(env.Services))
	}

	if env.Services[0].Name != "service1" || env.Services[0].ImageURL != "image1:latest" {
		t.Errorf("First service data is incorrect: %+v", env.Services[0])
	}

	if env.Services[1].Name != "service2" || env.Services[1].ImageURL != "image2:latest" {
		t.Errorf("Second service data is incorrect: %+v", env.Services[1])
	}
}

func TestEnvironment_MarshalUnmarshalRoundTrip(t *testing.T) {
	// Create test environment with services
	originalEnv := &Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		PRNumber:       123,
		Status:         "running",
		URL:            "https://test-repo-pr-123.example.com",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Services: []Service{
			{
				Name:     "service1",
				ImageURL: "image1:latest",
			},
			{
				Name:     "service2",
				ImageURL: "image2:latest",
			},
		},
	}

	// Marshal services
	if err := originalEnv.MarshalServices(); err != nil {
		t.Errorf("MarshalServices failed: %v", err)
	}

	// Create a new environment with the same data but no services
	newEnv := &Environment{
		ID:             originalEnv.ID,
		RepositoryName: originalEnv.RepositoryName,
		PRNumber:       originalEnv.PRNumber,
		Status:         originalEnv.Status,
		URL:            originalEnv.URL,
		CreatedAt:      originalEnv.CreatedAt,
		UpdatedAt:      originalEnv.UpdatedAt,
		ServicesData:   originalEnv.ServicesData,
	}

	// Unmarshal services
	if err := newEnv.UnmarshalServices(); err != nil {
		t.Errorf("UnmarshalServices failed: %v", err)
	}

	// Check if services were unmarshaled correctly
	if len(newEnv.Services) != len(originalEnv.Services) {
		t.Errorf("Expected %d services, got %d", len(originalEnv.Services), len(newEnv.Services))
	}

	for i, service := range originalEnv.Services {
		if newEnv.Services[i].Name != service.Name || newEnv.Services[i].ImageURL != service.ImageURL {
			t.Errorf("Service %d data is incorrect: expected %+v, got %+v", i, service, newEnv.Services[i])
		}
	}
}

func TestEnvironment_MarshalJSON(t *testing.T) {
	// Create test environment with services
	env := &Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		PRNumber:       123,
		Status:         "running",
		URL:            "https://test-repo-pr-123.example.com",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Services: []Service{
			{
				Name:     "service1",
				ImageURL: "image1:latest",
			},
			{
				Name:     "service2",
				ImageURL: "image2:latest",
			},
		},
	}

	// Marshal to JSON
	data, err := json.Marshal(env)
	if err != nil {
		t.Errorf("json.Marshal failed: %v", err)
	}

	// Unmarshal from JSON
	var unmarshaledEnv Environment
	if err := json.Unmarshal(data, &unmarshaledEnv); err != nil {
		t.Errorf("json.Unmarshal failed: %v", err)
	}

	// Check if data was marshaled and unmarshaled correctly
	if unmarshaledEnv.ID != env.ID {
		t.Errorf("Expected ID %s, got %s", env.ID, unmarshaledEnv.ID)
	}

	if unmarshaledEnv.RepositoryName != env.RepositoryName {
		t.Errorf("Expected RepositoryName %s, got %s", env.RepositoryName, unmarshaledEnv.RepositoryName)
	}

	if unmarshaledEnv.PRNumber != env.PRNumber {
		t.Errorf("Expected PRNumber %d, got %d", env.PRNumber, unmarshaledEnv.PRNumber)
	}

	if unmarshaledEnv.Status != env.Status {
		t.Errorf("Expected Status %s, got %s", env.Status, unmarshaledEnv.Status)
	}

	if unmarshaledEnv.URL != env.URL {
		t.Errorf("Expected URL %s, got %s", env.URL, unmarshaledEnv.URL)
	}

	if len(unmarshaledEnv.Services) != len(env.Services) {
		t.Errorf("Expected %d services, got %d", len(env.Services), len(unmarshaledEnv.Services))
	}
}
