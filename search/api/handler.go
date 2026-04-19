package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"

	"search/engine"
)

// IndexRequest é o payload para indexar um documento.
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

// Handler expõe o SearchEngine via HTTP.
type Handler struct {
	engine  *engine.SearchEngine
	writeMu sync.Mutex // serializa operações de escrita pesadas (reindex)
}

func NewHandler(e *engine.SearchEngine) *Handler {
	return &Handler{engine: e}
}

// Routes registra todas as rotas e retorna o mux configurado.
func (h *Handler) Routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.health)
	mux.HandleFunc("GET /debug", h.debug)
	mux.HandleFunc("GET /stats", h.stats)
	mux.HandleFunc("GET /search", h.search)
	mux.HandleFunc("POST /index", h.index)
	mux.HandleFunc("DELETE /index/{docID}", h.remove)
	mux.HandleFunc("POST /reindex", h.reindex)
	return mux
}

func (h *Handler) debug(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.engine.Debug())
}

// GET /health — liveness probe
func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GET /stats — métricas do índice
func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.engine.Stats())
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

// POST /index — indexa um único documento
func (h *Handler) index(w http.ResponseWriter, r *http.Request) {
	var req IndexRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}
	h.indexOne(req)
	w.WriteHeader(http.StatusNoContent)
}

// DELETE /index/{docID} — remove um documento
func (h *Handler) remove(w http.ResponseWriter, r *http.Request) {
	docID := r.PathValue("docID")
	if docID == "" {
		http.Error(w, `{"error":"missing docID"}`, http.StatusBadRequest)
		return
	}
	h.engine.RemoveDocument(docID)
	w.WriteHeader(http.StatusNoContent)
}

// POST /reindex — substitui o índice completo de forma atômica
func (h *Handler) reindex(w http.ResponseWriter, r *http.Request) {
	var docs []IndexRequest
	if err := json.NewDecoder(r.Body).Decode(&docs); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	h.writeMu.Lock()
	defer h.writeMu.Unlock()

	h.engine.Clear()
	for _, req := range docs {
		h.indexOne(req)
	}

	respond(w, http.StatusOK, map[string]int{"indexed": len(docs)})
}

// indexOne converte um IndexRequest em DocMeta e indexa no engine.
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

// respond serializa body como JSON e escreve na resposta.
func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}
