package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var log *zap.Logger

// Setup initializes the logger
func Setup(logLevel string) {
	// Parse log level
	level := zapcore.InfoLevel
	if err := level.UnmarshalText([]byte(logLevel)); err != nil {
		// Default to info level on error
		level = zapcore.InfoLevel
	}

	// Logger configuration
	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(level)
	config.OutputPaths = []string{"stdout"}
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	// Create logger
	var err error
	log, err = config.Build()
	if err != nil {
		os.Exit(1)
	}

	Info("Logger initialized", zap.String("level", level.String()))
}

// Info logs an info message
func Info(message string, fields ...zap.Field) {
	log.Info(message, fields...)
}

// Error logs an error message
func Error(message string, err error, fields ...zap.Field) {
	log.Error(message, append(fields, zap.Error(err))...)
}

// Debug logs a debug message
func Debug(message string, fields ...zap.Field) {
	log.Debug(message, fields...)
}

// Warn logs a warning message
func Warn(message string, fields ...zap.Field) {
	log.Warn(message, fields...)
}

// Fatal logs a fatal message and exits
func Fatal(message string, fields ...zap.Field) {
	log.Fatal(message, fields...)
}

// With creates a child logger with additional fields
func With(fields ...zap.Field) *zap.Logger {
	return log.With(fields...)
}

// Sync flushes any buffered log entries
func Sync() error {
	return log.Sync()
}
