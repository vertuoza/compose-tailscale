package logger

import (
	"bytes"
	"strings"
	"testing"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func TestLoggerSetup(t *testing.T) {
	// Create a buffer to capture log output
	var buf bytes.Buffer

	// Override the global logger for testing
	originalLogger := log
	defer func() {
		log = originalLogger
	}()

	// Create a custom encoder configuration
	encoderConfig := zap.NewProductionEncoderConfig()
	encoder := zapcore.NewJSONEncoder(encoderConfig)

	// Create a custom core that writes to our buffer
	core := zapcore.NewCore(encoder, zapcore.AddSync(&buf), zapcore.InfoLevel)
	log = zap.New(core)

	// Test Info logging
	Info("test info message", zap.String("key", "value"))
	logOutput := buf.String()

	if !strings.Contains(logOutput, "test info message") {
		t.Errorf("Expected log output to contain 'test info message', got: %s", logOutput)
	}
	if !strings.Contains(logOutput, "\"key\":\"value\"") {
		t.Errorf("Expected log output to contain key-value pair, got: %s", logOutput)
	}

	// Clear buffer
	buf.Reset()

	// Test Error logging
	Error("test error message", nil, zap.String("key", "value"))
	logOutput = buf.String()

	if !strings.Contains(logOutput, "test error message") {
		t.Errorf("Expected log output to contain 'test error message', got: %s", logOutput)
	}
	if !strings.Contains(logOutput, "\"key\":\"value\"") {
		t.Errorf("Expected log output to contain key-value pair, got: %s", logOutput)
	}
}

func TestLogLevelParsing(t *testing.T) {
	tests := []struct {
		level    string
		expected zapcore.Level
	}{
		{"debug", zapcore.DebugLevel},
		{"info", zapcore.InfoLevel},
		{"warn", zapcore.WarnLevel},
		{"error", zapcore.ErrorLevel},
		{"invalid", zapcore.InfoLevel}, // Default to info for invalid levels
	}

	for _, test := range tests {
		t.Run(test.level, func(t *testing.T) {
			result := getLogLevel(test.level)
			if result != test.expected {
				t.Errorf("Expected log level %v for input '%s', got %v", test.expected, test.level, result)
			}
		})
	}
}
