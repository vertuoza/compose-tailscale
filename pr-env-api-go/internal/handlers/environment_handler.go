package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/vertuoza/pr-env-api/internal/models"
	"github.com/vertuoza/pr-env-api/internal/services"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// EnvironmentHandler handles environment-related API requests
type EnvironmentHandler struct {
	environmentService services.EnvironmentService
}

// NewEnvironmentHandler creates a new environment handler
func NewEnvironmentHandler(environmentService services.EnvironmentService) *EnvironmentHandler {
	return &EnvironmentHandler{
		environmentService: environmentService,
	}
}

// CreateEnvironment handles POST /api/environments
func (h *EnvironmentHandler) CreateEnvironment(c *gin.Context) {
	var req struct {
		RepositoryName string          `json:"repository_name" binding:"required"`
		PRNumber       int             `json:"pr_number" binding:"required"`
		Services       []models.Service `json:"services" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate services
	if len(req.Services) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one service is required"})
		return
	}

	// Validate each service has name and image_url
	for _, service := range req.Services {
		if service.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Each service must have a name"})
			return
		}
		if service.ImageURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Each service must have an image_url"})
			return
		}
	}

	// Create environment
	environment, err := h.environmentService.CreateEnvironment(req.RepositoryName, req.PRNumber, req.Services)
	if err != nil {
		logger.Error("Failed to create environment", err,
			zap.String("repositoryName", req.RepositoryName),
			zap.Int("prNumber", req.PRNumber))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, environment)
}

// UpdateEnvironment handles PUT /api/environments/:id
func (h *EnvironmentHandler) UpdateEnvironment(c *gin.Context) {
	id := c.Param("id")

	// Parse the environment ID to get repository name and pr_number
	parts := strings.Split(id, "-pr-")
	if len(parts) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment ID format. Expected format: {repository_name}-pr-{pr_number}"})
		return
	}

	prNumber, err := strconv.Atoi(parts[1])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PR number in environment ID"})
		return
	}

	var req struct {
		RepositoryName string          `json:"repository_name" binding:"required"`
		Services       []models.Service `json:"services" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate services
	if len(req.Services) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one service is required"})
		return
	}

	// Validate each service has name and image_url
	for _, service := range req.Services {
		if service.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Each service must have a name"})
			return
		}
		if service.ImageURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Each service must have an image_url"})
			return
		}
	}

	// Update environment
	environment, err := h.environmentService.UpdateEnvironment(req.RepositoryName, prNumber, req.Services)
	if err != nil {
		logger.Error("Failed to update environment", err,
			zap.String("id", id),
			zap.String("repositoryName", req.RepositoryName),
			zap.Int("prNumber", prNumber))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, environment)
}

// RemoveEnvironment handles DELETE /api/environments/:id
func (h *EnvironmentHandler) RemoveEnvironment(c *gin.Context) {
	id := c.Param("id")

	// Parse the environment ID to get repository name and pr_number
	parts := strings.Split(id, "-pr-")
	if len(parts) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment ID format. Expected format: {repository_name}-pr-{pr_number}"})
		return
	}

	repositoryName := parts[0]
	prNumber, err := strconv.Atoi(parts[1])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PR number in environment ID"})
		return
	}

	// Remove environment
	result, err := h.environmentService.RemoveEnvironment(repositoryName, prNumber)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		logger.Error("Failed to remove environment", err,
			zap.String("id", id),
			zap.String("repositoryName", repositoryName),
			zap.Int("prNumber", prNumber))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetEnvironment handles GET /api/environments/:id
func (h *EnvironmentHandler) GetEnvironment(c *gin.Context) {
	id := c.Param("id")

	// Get environment
	environment, err := h.environmentService.GetEnvironment(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		logger.Error("Failed to get environment", err, zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, environment)
}

// ListEnvironments handles GET /api/environments
func (h *EnvironmentHandler) ListEnvironments(c *gin.Context) {
	// Parse query parameters
	status := c.Query("status")
	repositoryName := c.Query("repository_name")
	prNumberStr := c.Query("pr_number")

	// Build filters
	filters := make(map[string]interface{})

	if status != "" {
		filters["status"] = status
	}

	if repositoryName != "" {
		filters["repositoryName"] = repositoryName
	}

	if prNumberStr != "" {
		prNumber, err := strconv.Atoi(prNumberStr)
		if err == nil {
			filters["prNumber"] = prNumber
		}
	}

	// List environments
	environments, err := h.environmentService.ListEnvironments(filters)
	if err != nil {
		logger.Error("Failed to list environments", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"environments": environments})
}

// GetEnvironmentLogs handles GET /api/environments/:id/logs
func (h *EnvironmentHandler) GetEnvironmentLogs(c *gin.Context) {
	id := c.Param("id")

	// Get environment logs
	logs, err := h.environmentService.GetEnvironmentLogs(id)
	if err != nil {
		logger.Error("Failed to get environment logs", err, zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// SetupLocalEnvironment handles POST /api/environments/local-setup
func (h *EnvironmentHandler) SetupLocalEnvironment(c *gin.Context) {
	var req struct {
		RepositoryName string `json:"repository_name" binding:"required"`
		PRNumber       int    `json:"pr_number" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create environment with empty services array
	environment, err := h.environmentService.CreateEnvironment(req.RepositoryName, req.PRNumber, []models.Service{})
	if err != nil {
		logger.Error("Failed to set up local environment", err,
			zap.String("repositoryName", req.RepositoryName),
			zap.Int("prNumber", req.PRNumber))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, environment)
}

// RegisterRoutes registers the environment routes
func (h *EnvironmentHandler) RegisterRoutes(router *gin.RouterGroup) {
	environments := router.Group("/environments")
	{
		environments.POST("", h.CreateEnvironment)
		environments.PUT("/:id", h.UpdateEnvironment)
		environments.DELETE("/:id", h.RemoveEnvironment)
		environments.GET("/:id", h.GetEnvironment)
		environments.GET("", h.ListEnvironments)
		environments.GET("/:id/logs", h.GetEnvironmentLogs)
		environments.POST("/local-setup", h.SetupLocalEnvironment)
	}
}
