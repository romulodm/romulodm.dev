package engine

import (
	"sort"
	"time"
)

// SearchResult é o formato de um item no resultado de busca.
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

// SearchResponse é o envelope de resposta da API de busca.
type SearchResponse struct {
	Hits             []SearchResult `json:"hits"`
	ProcessingTimeMs int64          `json:"processingTimeMs"`
	Query            string         `json:"query"`
}

// SearchEngine orquestra índice, modelo vetorial e highlight.
// É thread-safe: múltiplas goroutines podem chamar Search() concorrentemente.
type SearchEngine struct {
	idx   *InvertedIndex
	model *VectorModel
	prep  *Preprocessor
}

func NewSearchEngine() *SearchEngine {
	idx := NewInvertedIndex()
	return &SearchEngine{
		idx:   idx,
		model: NewVectorModel(idx),
		prep:  idx.Preprocessor(),
	}
}

// engine/engine.go — adiciona esse método
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
			"terms":  doc.Terms, // stems → freq
		})
	}

	return map[string]any{
		"n":     e.idx.n,
		"terms": terms,
		"docs":  docs,
	}
}

// IndexDocument adiciona ou atualiza um documento no índice.
func (e *SearchEngine) IndexDocument(doc *DocMeta, fullText string) {
	e.idx.AddDocument(doc, fullText)
}

// RemoveDocument remove um documento do índice pelo seu ID.
func (e *SearchEngine) RemoveDocument(docID string) {
	e.idx.RemoveDocument(docID)
}

// Clear apaga completamente o índice.
func (e *SearchEngine) Clear() {
	e.idx.Clear()
}

// Stats retorna métricas básicas do índice.
func (e *SearchEngine) Stats() map[string]int {
	return map[string]int{
		"documents": e.idx.N(),
	}
}

// Search executa uma busca vetorial completa:
//  1. Tokeniza a query (com stemming e detecção de stopwords)
//  2. Expande cada stem com prefix search e typo-tolerance
//  3. Filtra candidatos por locale
//  4. Calcula similaridade por cosseno
//  5. Ordena por score e trunca ao limit
//  6. Aplica highlight stem-aware nos resultados
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

	// Ordena por score decrescente
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
