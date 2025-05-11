package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/vertuoza/pr-env-api/internal/services"
)

// SetupRouter sets up the API router
func SetupRouter(serviceFactory *services.Factory) *gin.Engine {
	// Set Gin to release mode in production
	// gin.SetMode(gin.ReleaseMode)

	// Create a new Gin router
	router := gin.New()

	// Apply middleware
	router.Use(LoggerMiddleware())
	router.Use(ErrorMiddleware())
	router.Use(CORSMiddleware())
	router.Use(gin.Recovery())

	// Create API group
	api := router.Group("/api")

	// Create handlers
	environmentHandler := NewEnvironmentHandler(serviceFactory.NewEnvironmentService())

	// Register routes
	environmentHandler.RegisterRoutes(api)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	return router
}
