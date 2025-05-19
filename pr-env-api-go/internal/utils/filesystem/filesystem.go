package filesystem

import (
	"io"
	"os"
	"path/filepath"

	"github.com/vertuoza/pr-env-api/internal/utils/logger"
	"go.uber.org/zap"
)

// EnsureDirectory ensures a directory exists
func EnsureDirectory(dirPath string) error {
	err := os.MkdirAll(dirPath, 0755)
	if err != nil {
		logger.Error("Failed to create directory", err, zap.String("path", dirPath))
		return err
	}

	logger.Debug("Ensured directory exists", zap.String("path", dirPath))
	return nil
}

// CopyDirectory copies a directory recursively
func CopyDirectory(src, dst string) error {
	// Ensure destination directory exists
	if err := EnsureDirectory(dst); err != nil {
		return err
	}

	// Walk through the source directory
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calculate relative path
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}

		// Skip if it's the root directory
		if relPath == "." {
			return nil
		}

		// Create destination path
		dstPath := filepath.Join(dst, relPath)

		// If it's a directory, create it
		if info.IsDir() {
			return EnsureDirectory(dstPath)
		}

		// Copy file
		return CopyFile(path, dstPath)
	})
}

// CopyFile copies a file
func CopyFile(src, dst string) error {
	// Open source file
	srcFile, err := os.Open(src)
	if err != nil {
		logger.Error("Failed to open source file", err, zap.String("path", src))
		return err
	}
	defer srcFile.Close()

	// Create destination file
	dstFile, err := os.Create(dst)
	if err != nil {
		logger.Error("Failed to create destination file", err, zap.String("path", dst))
		return err
	}
	defer dstFile.Close()

	// Copy content
	_, err = io.Copy(dstFile, srcFile)
	if err != nil {
		logger.Error("Failed to copy file content", err,
			zap.String("src", src),
			zap.String("dst", dst))
		return err
	}

	// Copy file permissions
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	return os.Chmod(dst, srcInfo.Mode())
}

// ReadFile reads a file
func ReadFile(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		logger.Error("Failed to read file", err, zap.String("path", filePath))
		return "", err
	}

	logger.Debug("Read file", zap.String("path", filePath))
	return string(data), nil
}

// WriteFile writes to a file
func WriteFile(filePath string, content string) error {
	// Ensure directory exists
	dir := filepath.Dir(filePath)
	if err := EnsureDirectory(dir); err != nil {
		return err
	}

	// Write file
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		logger.Error("Failed to write file", err, zap.String("path", filePath))
		return err
	}

	logger.Debug("Wrote to file", zap.String("path", filePath))
	return nil
}

// FileExists checks if a file exists
func FileExists(filePath string) (bool, error) {
	_, err := os.Stat(filePath)
	if err == nil {
		return true, nil
	}

	if os.IsNotExist(err) {
		return false, nil
	}

	logger.Error("Error checking if file exists", err, zap.String("path", filePath))
	return false, err
}

// Remove removes a file or directory
func Remove(path string) error {
	err := os.RemoveAll(path)
	if err != nil {
		logger.Error("Failed to remove path", err, zap.String("path", path))
		return err
	}

	logger.Debug("Removed path", zap.String("path", path))
	return nil
}
