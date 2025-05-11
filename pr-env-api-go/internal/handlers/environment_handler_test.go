package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vertuoza/pr-env-api/internal/models"
)

// MockEnvironmentService is a mock implementation of the EnvironmentService interface
type MockEnvironmentService struct {
	mock.Mock
}

func (m *MockEnvironmentService) CreateEnvironment(repositoryName string, prNumber int, services []models.Service) (*models.Environment, error) {
	args := m.Called(repositoryName, prNumber, services)
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentService) UpdateEnvironment(repositoryName string, prNumber int, services []models.Service) (*models.Environment, error) {
	args := m.Called(repositoryName, prNumber, services)
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentService) RemoveEnvironment(repositoryName string, prNumber int) (*models.Environment, error) {
	args := m.Called(repositoryName, prNumber)
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentService) GetEnvironment(id string) (*models.Environment, error) {
	args := m.Called(id)
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentService) ListEnvironments(filters map[string]interface{}) ([]*models.Environment, error) {
	args := m.Called(filters)
	return args.Get(0).([]*models.Environment), args.Error(1)
}

func (m *MockEnvironmentService) GetEnvironmentLogs(environmentID string) ([]*models.EnvironmentLog, error) {
	args := m.Called(environmentID)
	return args.Get(0).([]*models.EnvironmentLog), args.Error(1)
}

func setupTestRouter() (*gin.Engine, *MockEnvironmentService) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	mockService := new(MockEnvironmentService)
	handler := NewEnvironmentHandler(mockService)
	api := router.Group("/api")
	handler.RegisterRoutes(api)
	return router, mockService
}

func TestCreateEnvironment(t *testing.T) {
	router, mockService := setupTestRouter()

	// Setup mock
	env := &models.Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		PRNumber:       123,
		Status:         "running",
		URL:            "https://test-repo-pr-123.example.com",
		Services: []models.Service{
			{
				Name:     "service1",
				ImageURL: "image1:latest",
			},
		},
	}
	mockService.On("CreateEnvironment", "test-repo", 123, mock.AnythingOfType("[]models.Service")).Return(env, nil)

	// Create request
	reqBody := map[string]interface{}{
		"repository_name": "test-repo",
		"pr_number":       123,
		"services": []map[string]string{
			{
				"name":      "service1",
				"image_url": "image1:latest",
			},
		},
	}
	reqJSON, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/environments", bytes.NewBuffer(reqJSON))
	req.Header.Set("Content-Type", "application/json")

	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusCreated, w.Code)
	var response models.Environment
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "test-repo-pr-123", response.ID)
	assert.Equal(t, "test-repo", response.RepositoryName)
	assert.Equal(t, 123, response.PRNumber)
	assert.Equal(t, "running", response.Status)
	assert.Equal(t, "https://test-repo-pr-123.example.com", response.URL)
	assert.Len(t, response.Services, 1)
	assert.Equal(t, "service1", response.Services[0].Name)
	assert.Equal(t, "image1:latest", response.Services[0].ImageURL)

	// Verify mock
	mockService.AssertExpectations(t)
}

func TestGetEnvironment(t *testing.T) {
	router, mockService := setupTestRouter()

	// Setup mock
	env := &models.Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		PRNumber:       123,
		Status:         "running",
		URL:            "https://test-repo-pr-123.example.com",
		Services: []models.Service{
			{
				Name:     "service1",
				ImageURL: "image1:latest",
			},
		},
	}
	mockService.On("GetEnvironment", "test-repo-pr-123").Return(env, nil)

	// Create request
	req, _ := http.NewRequest("GET", "/api/environments/test-repo-pr-123", nil)

	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)
	var response models.Environment
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "test-repo-pr-123", response.ID)
	assert.Equal(t, "test-repo", response.RepositoryName)
	assert.Equal(t, 123, response.PRNumber)
	assert.Equal(t, "running", response.Status)
	assert.Equal(t, "https://test-repo-pr-123.example.com", response.URL)
	assert.Len(t, response.Services, 1)
	assert.Equal(t, "service1", response.Services[0].Name)
	assert.Equal(t, "image1:latest", response.Services[0].ImageURL)

	// Verify mock
	mockService.AssertExpectations(t)
}

func TestListEnvironments(t *testing.T) {
	router, mockService := setupTestRouter()

	// Setup mock
	envs := []*models.Environment{
		{
			ID:             "test-repo-pr-123",
			RepositoryName: "test-repo",
			PRNumber:       123,
			Status:         "running",
			URL:            "https://test-repo-pr-123.example.com",
		},
		{
			ID:             "test-repo-pr-456",
			RepositoryName: "test-repo",
			PRNumber:       456,
			Status:         "running",
			URL:            "https://test-repo-pr-456.example.com",
		},
	}
	mockService.On("ListEnvironments", mock.AnythingOfType("map[string]interface {}")).Return(envs, nil)

	// Create request
	req, _ := http.NewRequest("GET", "/api/environments", nil)

	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "environments")
	environments := response["environments"].([]interface{})
	assert.Len(t, environments, 2)

	// Verify mock
	mockService.AssertExpectations(t)
}

func TestRemoveEnvironment(t *testing.T) {
	router, mockService := setupTestRouter()

	// Setup mock
	env := &models.Environment{
		ID:             "test-repo-pr-123",
		RepositoryName: "test-repo",
		Status:         "removed",
	}
	mockService.On("RemoveEnvironment", "test-repo", 123).Return(env, nil)

	// Create request
	req, _ := http.NewRequest("DELETE", "/api/environments/test-repo-pr-123", nil)

	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)
	var response models.Environment
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "test-repo-pr-123", response.ID)
	assert.Equal(t, "test-repo", response.RepositoryName)
	assert.Equal(t, "removed", response.Status)

	// Verify mock
	mockService.AssertExpectations(t)
}
