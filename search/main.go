package main

import (
	"log"
	"net/http"
	"os"

	"search/api"
	"search/engine"
)

func main() {
	e := engine.NewSearchEngine()

	// SnapshotManager lives in the api package because IndexRequest
	// (which includes Excerpt) is the canonical persistence unit.
	snapPath := os.Getenv("SNAPSHOT_PATH") // defaults to /data/documents.json
	snap := api.NewSnapshotManager(snapPath)

	// Restore documents from disk before the HTTP server accepts traffic.
	// On first boot (no snapshot file) Load returns nil — the engine starts
	// empty and the worker's startup reindex call will populate it.
	initialDocs, err := snap.Load()
	if err != nil {
		log.Printf("[search] snapshot load error (starting empty): %v", err)
		initialDocs = nil
	}

	// NewHandler replays initialDocs through the engine on construction so
	// the index is immediately consistent before the first request arrives.
	h := api.NewHandler(e, snap, initialDocs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[search] listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, h.Routes()))
}
