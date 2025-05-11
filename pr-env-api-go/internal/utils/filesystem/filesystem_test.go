package filesystem

import (
	"os"
	"path/filepath"
	"testing"
)

func TestEnsureDirectory(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "filesystem_test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Test creating a new directory
	testDir := filepath.Join(tempDir, "test_dir")
	if err := EnsureDirectory(testDir); err != nil {
		t.Errorf("EnsureDirectory failed: %v", err)
	}

	// Check if directory was created
	if _, err := os.Stat(testDir); os.IsNotExist(err) {
		t.Errorf("Directory was not created")
	}

	// Test with an existing directory (should not error)
	if err := EnsureDirectory(testDir); err != nil {
		t.Errorf("EnsureDirectory failed on existing directory: %v", err)
	}

	// Test with nested directories
	nestedDir := filepath.Join(tempDir, "nested/dir/structure")
	if err := EnsureDirectory(nestedDir); err != nil {
		t.Errorf("EnsureDirectory failed for nested directories: %v", err)
	}

	// Check if nested directory was created
	if _, err := os.Stat(nestedDir); os.IsNotExist(err) {
		t.Errorf("Nested directory was not created")
	}
}

func TestFileExists(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "filesystem_test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a test file
	testFile := filepath.Join(tempDir, "test_file.txt")
	if err := os.WriteFile(testFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Test with existing file
	if exists := FileExists(testFile); !exists {
		t.Errorf("FileExists returned false for existing file")
	}

	// Test with non-existing file
	nonExistingFile := filepath.Join(tempDir, "non_existing.txt")
	if exists := FileExists(nonExistingFile); exists {
		t.Errorf("FileExists returned true for non-existing file")
	}

	// Test with directory
	if exists := FileExists(tempDir); exists {
		t.Errorf("FileExists returned true for directory")
	}
}

func TestCopyDirectory(t *testing.T) {
	// Create source and destination directories
	sourceDir, err := os.MkdirTemp("", "source")
	if err != nil {
		t.Fatalf("Failed to create source directory: %v", err)
	}
	defer os.RemoveAll(sourceDir)

	destDir, err := os.MkdirTemp("", "dest")
	if err != nil {
		t.Fatalf("Failed to create destination directory: %v", err)
	}
	defer os.RemoveAll(destDir)

	// Create some files in the source directory
	testFiles := []string{
		"file1.txt",
		"file2.txt",
		"subdir/file3.txt",
	}

	for _, file := range testFiles {
		filePath := filepath.Join(sourceDir, file)
		dirPath := filepath.Dir(filePath)

		if err := os.MkdirAll(dirPath, 0755); err != nil {
			t.Fatalf("Failed to create directory %s: %v", dirPath, err)
		}

		if err := os.WriteFile(filePath, []byte("test content"), 0644); err != nil {
			t.Fatalf("Failed to create file %s: %v", filePath, err)
		}
	}

	// Test copying directory
	if err := CopyDirectory(sourceDir, destDir); err != nil {
		t.Errorf("CopyDirectory failed: %v", err)
	}

	// Check if files were copied
	for _, file := range testFiles {
		destFile := filepath.Join(destDir, file)
		if _, err := os.Stat(destFile); os.IsNotExist(err) {
			t.Errorf("File %s was not copied", destFile)
		}
	}
}

func TestRemove(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "filesystem_test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a test file
	testFile := filepath.Join(tempDir, "test_file.txt")
	if err := os.WriteFile(testFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Test removing file
	if err := Remove(testFile); err != nil {
		t.Errorf("Remove failed for file: %v", err)
	}

	// Check if file was removed
	if _, err := os.Stat(testFile); !os.IsNotExist(err) {
		t.Errorf("File was not removed")
	}

	// Create a test directory with files
	testDir := filepath.Join(tempDir, "test_dir")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("Failed to create test directory: %v", err)
	}

	testDirFile := filepath.Join(testDir, "file.txt")
	if err := os.WriteFile(testDirFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create file in test directory: %v", err)
	}

	// Test removing directory
	if err := Remove(testDir); err != nil {
		t.Errorf("Remove failed for directory: %v", err)
	}

	// Check if directory was removed
	if _, err := os.Stat(testDir); !os.IsNotExist(err) {
		t.Errorf("Directory was not removed")
	}
}
