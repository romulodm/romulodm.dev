package engine

import (
	"sort"
	"time"
)

// SearchResult is the shape of a single hit returned by the search API.
type SearchResult struct {
	Slug          string   `json:"slug"`
	Title         string   `json:"title"`
	Summary       string   `json:"summary"`
	CoverImageURL string   `json:"coverImageUrl"`
	Tags          []string `json:"tags"`
	PublishedAt   int64    `json:"publishedAt"`
	Score         float64  `json:"score"`
	Highlights    struct {
		Title   string `json:"title"`
		Summary string `json:"summary"`
	} `json:"highlights"`
}

// SearchResponse is the top-level envelope returned by GET /search.
type SearchResponse struct {
	Hits             []SearchResult `json:"hits"`
	ProcessingTimeMs int64          `json:"processingTimeMs"`
	Query            string         `json:"query"`
}

// SearchEngine orchestrates the inverted index, vector model, and highlighter.
// It is safe for concurrent use: multiple goroutines can call Search simultaneously.
type SearchEngine struct {
	idx   *InvertedIndex
	model *VectorModel
	prep  *Preprocessor
}

// NewSearchEngine initialises a ready-to-use, empty SearchEngine.
func NewSearchEngine() *SearchEngine {
	idx := NewInvertedIndex()
	return &SearchEngine{
		idx:   idx,
		model: NewVectorModel(idx),
		prep:  idx.Preprocessor(),
	}
}

// Debug returns a raw dump of index internals — terms, documents and their
// stem frequencies. Exposed via GET /debug; should not be publicly reachable
// in production (restrict at the nginx / compose level).
func (e *SearchEngine) Debug() map[string]any {
	e.idx.mu.RLock()
	defer e.idx.mu.RUnlock()

	terms := make([]string, 0, len(e.idx.terms))
	for t := range e.idx.terms {
		terms = append(terms, t)
	}

	docs := make([]map[string]any, 0, len(e.idx.docs))
	for id, doc := range e.idx.docs {
		docs = append(docs, map[string]any{
			"id":     id,
			"locale": doc.Locale,
			"title":  doc.Title,
			"terms":  doc.Terms,
		})
	}

	return map[string]any{
		"n":     e.idx.n,
		"terms": terms,
		"docs":  docs,
	}
}

// IndexDocument adds or replaces a document in the index.
// fullText should include every searchable field (title + summary + excerpt).
func (e *SearchEngine) IndexDocument(doc *DocMeta, fullText string) {
	e.idx.AddDocument(doc, fullText)
}

// RemoveDocument removes a document from the index by its ID.
// It is a no-op if the document does not exist.
func (e *SearchEngine) RemoveDocument(docID string) {
	e.idx.RemoveDocument(docID)
}

// Clear wipes the entire index. Used by Reindex before re-adding all documents.
func (e *SearchEngine) Clear() {
	e.idx.Clear()
}

// Stats returns basic index metrics for the /stats endpoint and the admin
// dashboard. The "documents" count is the only reliable live metric because
// IDF weights and term vectors are computed lazily during Search.
func (e *SearchEngine) Stats() map[string]int {
	return map[string]int{
		"documents": e.idx.N(),
	}
}

// AllDocuments returns a snapshot-safe copy of every DocMeta currently held
// in the inverted index.
//
// NOTE: DocMeta does NOT include the original excerpt text, only the metadata
// fields. The full-text string used at index time (title + summary + excerpt)
// is NOT recoverable from this method alone — see the note in api/snapshot.go
// about why the handler owns the authoritative document list for persistence.
//
// This method is used by GET /debug and future observability endpoints. It is
// NOT used by the snapshot path.
func (e *SearchEngine) AllDocuments() []*DocMeta {
	e.idx.mu.RLock()
	defer e.idx.mu.RUnlock()

	out := make([]*DocMeta, 0, len(e.idx.docs))
	for _, doc := range e.idx.docs {
		// Shallow copy so callers cannot mutate internal state.
		d := *doc
		out = append(out, &d)
	}
	return out
}

// Search runs a full vector search pipeline:
//  1. Tokenises the query (stemming + stopword weighting)
//  2. Expands each stem via prefix search and typo-tolerance
//  3. Filters candidates by locale (exact match)
//  4. Scores each candidate with cosine similarity
//  5. Sorts descending by score and truncates to limit
//  6. Applies stem-aware highlights on title and summary
func (e *SearchEngine) Search(query, locale string, limit int) SearchResponse {
	start := time.Now()

	tokens := e.prep.Tokenize(query, locale)
	if len(tokens) == 0 || e.idx.N() == 0 {
		return SearchResponse{Hits: []SearchResult{}, Query: query}
	}

	queryTerms := e.model.BuildQueryTerms(tokens)
	candidates := e.model.Candidates(queryTerms)

	type scored struct {
		docID string
		score float64
	}
	results := make([]scored, 0, len(candidates))

	for docID := range candidates {
		doc := e.idx.Doc(docID)
		if doc == nil {
			continue
		}
		if locale != "" && doc.Locale != locale {
			continue
		}

		score := e.model.CosineSimilarity(docID, queryTerms)
		if score > 0 {
			results = append(results, scored{docID, score})
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].score > results[j].score
	})

	if limit > 0 && len(results) > limit {
		results = results[:limit]
	}

	hits := make([]SearchResult, 0, len(results))
	for _, r := range results {
		doc := e.idx.Doc(r.docID)
		if doc == nil {
			continue
		}

		title := Highlight(doc.Title, tokens, e.prep, locale)
		summary := Highlight(doc.Summary, tokens, e.prep, locale)

		hit := SearchResult{
			Slug:          doc.Slug,
			Title:         title,
			Summary:       summary,
			CoverImageURL: doc.CoverImageURL,
			Tags:          doc.Tags,
			PublishedAt:   doc.PublishedAt,
			Score:         r.score,
		}
		hit.Highlights.Title = title
		hit.Highlights.Summary = summary

		hits = append(hits, hit)
	}

	return SearchResponse{
		Hits:             hits,
		ProcessingTimeMs: time.Since(start).Milliseconds(),
		Query:            query,
	}
}
