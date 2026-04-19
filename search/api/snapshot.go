package api

import (
	"encoding/json"
	"errors"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const defaultSnapshotPath = "/data/documents.json"

type snapshotFile struct {
	SavedAt   time.Time      `json:"saved_at"`
	Documents []IndexRequest `json:"documents"`
}

// SnapshotInfo is returned by FileInfo() and surfaced in /stats.
type SnapshotInfo struct {
	Path        string    `json:"path"`
	SizeBytes   int64     `json:"size_bytes"`
	LastSavedAt time.Time `json:"last_saved_at"`
	Volume      string    `json:"volume"`
}

// SnapshotManager serialises and restores the handler's document list.
type SnapshotManager struct {
	path string
	mu   sync.Mutex
}

// NewSnapshotManager creates a SnapshotManager writing to path.
// Pass an empty string to use the default path (/data/documents.json).
func NewSnapshotManager(path string) *SnapshotManager {
	if path == "" {
		path = defaultSnapshotPath
	}
	return &SnapshotManager{path: path}
}

// Save writes docs to disk atomically using a temp-file + rename strategy.
func (s *SnapshotManager) Save(docs []IndexRequest) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(docs) == 0 {
		log.Printf("[snapshot] skipping save — document list is empty")
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return err
	}

	tmp, err := os.CreateTemp(filepath.Dir(s.path), ".snap-*.json.tmp")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()

	enc := json.NewEncoder(tmp)
	enc.SetIndent("", "  ")
	if err := enc.Encode(snapshotFile{SavedAt: time.Now().UTC(), Documents: docs}); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return err
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return err
	}
	if err := os.Rename(tmpPath, s.path); err != nil {
		os.Remove(tmpPath)
		return err
	}

	log.Printf("[snapshot] saved %d documents → %s", len(docs), s.path)
	return nil
}

// Load reads the snapshot and returns its document list.
// Returns (nil, nil) when no snapshot file exists yet.
func (s *SnapshotManager) Load() ([]IndexRequest, error) {
	f, err := os.Open(s.path)
	if errors.Is(err, os.ErrNotExist) {
		log.Printf("[snapshot] no snapshot at %s — index will be empty until first reindex", s.path)
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var snap snapshotFile
	if err := json.NewDecoder(f).Decode(&snap); err != nil {
		return nil, err
	}

	log.Printf("[snapshot] loaded %d documents (saved %s)",
		len(snap.Documents), snap.SavedAt.Format(time.RFC3339))
	return snap.Documents, nil
}

// SaveAsync calls Save in a background goroutine and logs any error.
func (s *SnapshotManager) SaveAsync(docs []IndexRequest) {
	cp := make([]IndexRequest, len(docs))
	copy(cp, docs)
	go func() {
		if err := s.Save(cp); err != nil {
			log.Printf("[snapshot] async save error: %v", err)
		}
	}()
}

// FileInfo returns metadata about the on-disk snapshot file.
// Returns nil if the file does not exist yet (first boot before any reindex).
// The Volume field is hardcoded to "search_data" — the Docker named volume
// defined in docker-compose — purely for display purposes in the dashboard.
func (s *SnapshotManager) FileInfo() *SnapshotInfo {
	s.mu.Lock()
	defer s.mu.Unlock()

	info, err := os.Stat(s.path)
	if err != nil {
		// File not yet created — normal on first boot.
		return nil
	}
	return &SnapshotInfo{
		Path:        s.path,
		SizeBytes:   info.Size(),
		LastSavedAt: info.ModTime().UTC(),
		Volume:      "search_data",
	}
}
