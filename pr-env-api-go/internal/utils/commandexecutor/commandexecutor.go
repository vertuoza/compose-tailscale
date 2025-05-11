package commandexecutor

import (
	"bytes"
	"context"
	"os/exec"
	"time"

	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// CommandExecutor executes shell commands
type CommandExecutor struct {
	defaultTimeout time.Duration
}

// NewCommandExecutor creates a new command executor
func NewCommandExecutor(defaultTimeout time.Duration) *CommandExecutor {
	if defaultTimeout == 0 {
		defaultTimeout = 5 * time.Minute
	}

	return &CommandExecutor{
		defaultTimeout: defaultTimeout,
	}
}

// Execute executes a command with the default timeout
func (e *CommandExecutor) Execute(command string) (string, error) {
	return e.ExecuteWithTimeout(command, e.defaultTimeout)
}

// ExecuteWithTimeout executes a command with a specific timeout
func (e *CommandExecutor) ExecuteWithTimeout(command string, timeout time.Duration) (string, error) {
	logger.Info("Executing command", zap.String("command", command))

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Create command
	cmd := exec.CommandContext(ctx, "sh", "-c", command)

	// Capture output
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Execute command
	err := cmd.Run()

	// Log output
	if stderr.Len() > 0 {
		logger.Warn("Command stderr", zap.String("stderr", stderr.String()))
	}

	if err != nil {
		logger.Error("Command execution error", err,
			zap.String("command", command),
			zap.String("stderr", stderr.String()))
		return "", err
	}

	output := stdout.String()
	logger.Debug("Command stdout", zap.String("stdout", output))

	return output, nil
}
