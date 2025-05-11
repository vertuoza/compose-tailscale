package handlers

import (
	"bytes"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// LoggerMiddleware logs request and response details
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Read the request body
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// Restore the request body
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Create a response writer that captures the response
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		// Process request
		c.Next()

		// Log request and response
		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		// Truncate request and response bodies if they are too large
		requestBodyStr := truncateString(string(requestBody), 1000)
		responseBodyStr := truncateString(blw.body.String(), 1000)

		logger.Info("API Request",
			zap.String("path", path),
			zap.String("method", method),
			zap.String("ip", clientIP),
			zap.Int("status", statusCode),
			zap.Duration("latency", latency),
			zap.String("request", requestBodyStr),
			zap.String("response", responseBodyStr),
		)
	}
}

// ErrorMiddleware handles errors
func ErrorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check if there are any errors
		if len(c.Errors) > 0 {
			for _, e := range c.Errors {
				logger.Error("API Error", e.Err, zap.String("path", c.Request.URL.Path))
			}
		}
	}
}

// CORSMiddleware handles CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// bodyLogWriter is a custom response writer that captures the response body
type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

// Write writes the response and captures it
func (w *bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// truncateString truncates a string if it's longer than maxLen
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
