package commandexecutor

import (
	"strings"
	"testing"
	"time"
)

func TestCommandExecutor_Execute(t *testing.T) {
	executor := NewCommandExecutor(5 * time.Second)

	// Test successful command execution
	output, err := executor.Execute("echo 'Hello, World!'")
	if err != nil {
		t.Errorf("Execute failed for valid command: %v", err)
	}
	if !strings.Contains(output, "Hello, World!") {
		t.Errorf("Expected output to contain 'Hello, World!', got: %s", output)
	}

	// Test command with error
	_, err = executor.Execute("command_that_does_not_exist")
	if err == nil {
		t.Errorf("Expected error for invalid command, got nil")
	}
}

func TestCommandExecutor_ExecuteWithTimeout(t *testing.T) {
	// Create executor with very short timeout
	executor := NewCommandExecutor(100 * time.Millisecond)

	// Test command that exceeds timeout
	_, err := executor.Execute("sleep 2")
	if err == nil {
		t.Errorf("Expected timeout error, got nil")
	}
	if !strings.Contains(err.Error(), "timeout") && !strings.Contains(err.Error(), "killed") {
		t.Errorf("Expected timeout error message, got: %v", err)
	}
}

func TestCommandExecutor_ExecuteWithOutput(t *testing.T) {
	executor := NewCommandExecutor(5 * time.Second)

	// Test command with multiple lines of output
	output, err := executor.Execute("echo 'Line 1' && echo 'Line 2'")
	if err != nil {
		t.Errorf("Execute failed for command with multiple outputs: %v", err)
	}
	if !strings.Contains(output, "Line 1") || !strings.Contains(output, "Line 2") {
		t.Errorf("Expected output to contain both lines, got: %s", output)
	}

	// Test command with stderr output
	output, err = executor.Execute("echo 'Error message' >&2")
	if err != nil {
		t.Errorf("Execute failed for command with stderr output: %v", err)
	}
	if !strings.Contains(output, "Error message") {
		t.Errorf("Expected output to contain stderr message, got: %s", output)
	}
}

func TestCommandExecutor_ExecuteWithEnvironment(t *testing.T) {
	executor := NewCommandExecutor(5 * time.Second)

	// Test command with environment variables
	output, err := executor.Execute("TEST_VAR='test value' && echo $TEST_VAR")
	if err != nil {
		t.Errorf("Execute failed for command with environment variables: %v", err)
	}
	if !strings.Contains(output, "test value") {
		t.Errorf("Expected output to contain environment variable value, got: %s", output)
	}
}
