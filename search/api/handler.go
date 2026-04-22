package api

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"search/engine"
)

// IndexRequest is the payload accepted by POST /index and POST /reindex.
type IndexRequest struct {
	ID            string   `json:"id"`
	Slug          string   `json:"slug"`
	Locale        string   `json:"locale"`
	Title         string   `json:"title"`
	Summary       string   `json:"summary"`
	Excerpt       string   `json:"excerpt"`
	Tags          []string `json:"tags"`
	PublishedAt   int64    `json:"publishedAt"`
	CoverImageURL string   `json:"coverImageUrl"`
}

// Handler exposes the SearchEngine over HTTP and owns the authoritative
// document list used for snapshot persistence.
type Handler struct {
	engine    *engine.SearchEngine
	snap      *SnapshotManager
	writeMu   sync.Mutex // serialises all write operations
	lastDocs  []IndexRequest
	startedAt time.Time // used to compute uptime in /stats
}

// NewHandler wires together the engine and snapshot manager.
func NewHandler(e *engine.SearchEngine, snap *SnapshotManager, initialDocs []IndexRequest) *Handler {
	h := &Handler{
		engine:    e,
		snap:      snap,
		lastDocs:  initialDocs,
		startedAt: time.Now(),
	}
	for _, req := range initialDocs {
		h.indexOne(req)
	}
	return h
}

// requireAuth retorna um middleware que exige Bearer token via Authorization header.
// O token é lido de SEARCH_INTERNAL_SECRET; se a variável não estiver definida,
// a autenticação é ignorada (compatibilidade com ambientes de dev sem secret).
func (h *Handler) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		secret := os.Getenv("SEARCH_INTERNAL_SECRET")
		if secret != "" {
			auth := r.Header.Get("Authorization")
			if !strings.HasPrefix(auth, "Bearer ") || strings.TrimPrefix(auth, "Bearer ") != secret {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
		}
		next(w, r)
	}
}

// Routes registers all endpoints and returns the configured mux.
// Rotas públicas:  GET /health, GET /search
// Rotas protegidas (requerem SEARCH_INTERNAL_SECRET): todas as demais.
func (h *Handler) Routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.health)
	mux.HandleFunc("GET /search", h.search)
	mux.HandleFunc("GET /debug", h.requireAuth(h.debug))
	mux.HandleFunc("GET /stats", h.requireAuth(h.stats))
	mux.HandleFunc("POST /index", h.requireAuth(h.index))
	mux.HandleFunc("DELETE /index/{docID}", h.requireAuth(h.remove))
	mux.HandleFunc("POST /reindex", h.requireAuth(h.reindex))
	return mux
}

// GET /health
func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GET /debug
func (h *Handler) debug(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.engine.Debug())
}

// GET /stats — index metrics consumed by the admin dashboard.
func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	h.writeMu.Lock()
	docs := make([]IndexRequest, len(h.lastDocs))
	copy(docs, h.lastDocs)
	snapPath := h.snap.path
	h.writeMu.Unlock()

	// Language breakdown — count documents per locale.
	languages := map[string]int{}
	for _, d := range docs {
		if d.Locale != "" {
			languages[d.Locale]++
		}
	}

	// Uptime in whole seconds since the process started.
	uptimeSeconds := int(time.Since(h.startedAt).Seconds())

	// Snapshot file metadata (size, last-saved timestamp).
	// Returns nil if the snapshot file does not exist yet.
	snapInfo := h.snap.FileInfo()

	respond(w, http.StatusOK, map[string]any{
		"handler_docs":   len(docs),
		"uptime_seconds": uptimeSeconds,
		"languages":      languages,
		"snapshot_path":  snapPath,
		"snapshot":       snapInfo, // nil → omitted by json.Marshal when using omitempty
	})
}

// GET /search?q=...&locale=...&limit=...
func (h *Handler) search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	locale := r.URL.Query().Get("locale")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 20 {
		limit = 8
	}
	respond(w, http.StatusOK, h.engine.Search(q, locale, limit))
}

// POST /index — adds or updates a single document.
func (h *Handler) index(w http.ResponseWriter, r *http.Request) {
	var req IndexRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	h.writeMu.Lock()
	h.indexOne(req)
	h.lastDocs = upsert(h.lastDocs, req)
	docs := h.lastDocs
	h.writeMu.Unlock()

	h.snap.SaveAsync(docs)
	w.WriteHeader(http.StatusNoContent)
}

// DELETE /index/{docID} — removes a document from the index.
func (h *Handler) remove(w http.ResponseWriter, r *http.Request) {
	docID := r.PathValue("docID")
	if docID == "" {
		http.Error(w, `{"error":"missing docID"}`, http.StatusBadRequest)
		return
	}

	h.writeMu.Lock()
	h.engine.RemoveDocument(docID)
	h.lastDocs = removeByID(h.lastDocs, docID)
	docs := h.lastDocs
	h.writeMu.Unlock()

	h.snap.SaveAsync(docs)
	w.WriteHeader(http.StatusNoContent)
}

// POST /reindex — atomically replaces the entire index.
func (h *Handler) reindex(w http.ResponseWriter, r *http.Request) {
	var docs []IndexRequest
	if err := json.NewDecoder(r.Body).Decode(&docs); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	h.writeMu.Lock()
	h.engine.Clear()
	for _, req := range docs {
		h.indexOne(req)
	}
	h.lastDocs = docs
	h.writeMu.Unlock()

	h.snap.SaveAsync(docs)
	respond(w, http.StatusOK, map[string]int{"indexed": len(docs)})
}

// indexOne converts an IndexRequest into a DocMeta and indexes it.
// Must be called with writeMu held.
func (h *Handler) indexOne(req IndexRequest) {
	doc := &engine.DocMeta{
		ID:            req.ID,
		Slug:          req.Slug,
		Locale:        req.Locale,
		Title:         req.Title,
		Summary:       req.Summary,
		Tags:          req.Tags,
		PublishedAt:   req.PublishedAt,
		CoverImageURL: req.CoverImageURL,
	}
	fullText := req.Title + " " + req.Summary + " " + req.Excerpt
	h.engine.IndexDocument(doc, fullText)
}

func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func upsert(docs []IndexRequest, req IndexRequest) []IndexRequest {
	for i, d := range docs {
		if d.ID == req.ID {
			docs[i] = req
			return docs
		}
	}
	return append(docs, req)
}

func removeByID(docs []IndexRequest, id string) []IndexRequest {
	out := docs[:0]
	for _, d := range docs {
		if d.ID != id {
			out = append(out, d)
		}
	}
	return out
}
