package engine

import (
	"math"
	"sync"
)

// TermEntry armazena document frequency e postings list de um stem.
type TermEntry struct {
	DF       int
	Postings map[string]int // docID → frequência
}

// DocMeta armazena metadados e estado de indexação de um documento.
type DocMeta struct {
	ID            string
	Slug          string
	Locale        string
	Title         string
	Summary       string
	Tags          []string
	PublishedAt   int64
	CoverImageURL string
	MaxFreq       int            // frequência máxima de qualquer termo neste doc (para TF)
	Terms         map[string]int // stem → freq (permite remoção O(1) sem SCAN)
	TagStems      map[string]bool
}

// InvertedIndex é o núcleo do motor de busca.
// Mantém o índice completamente em memória com acesso thread-safe via RWMutex.
// Integra Trie (prefix search) e BK-tree (typo-tolerance) como estruturas auxiliares.
type InvertedIndex struct {
	mu     sync.RWMutex
	terms  map[string]*TermEntry // stem → entry
	docs   map[string]*DocMeta   // docID → meta
	trie   *Trie
	bktree *BKTree
	n      int // total de documentos indexados
	prep   *Preprocessor
}

func NewInvertedIndex() *InvertedIndex {
	return &InvertedIndex{
		terms:  make(map[string]*TermEntry),
		docs:   make(map[string]*DocMeta),
		trie:   NewTrie(),
		bktree: NewBKTree(),
		prep:   NewPreprocessor(),
	}
}

// N retorna o total de documentos no índice.
func (idx *InvertedIndex) N() int {
	idx.mu.RLock()
	defer idx.mu.RUnlock()
	return idx.n
}

// AddDocument indexa ou re-indexa um documento.
// Se o documento já existir, remove a versão anterior antes de inserir.
func (idx *InvertedIndex) AddDocument(doc *DocMeta, fullText string) {
	tokens := idx.prep.Tokenize(fullText, doc.Locale)

	freq := make(map[string]int)
	for _, t := range tokens {
		freq[t.Stem]++
	}

	maxFreq := 0
	for _, f := range freq {
		if f > maxFreq {
			maxFreq = f
		}
	}

	tagStems := make(map[string]bool)
	for _, tag := range doc.Tags {
		for _, t := range idx.prep.Tokenize(tag, doc.Locale) {
			tagStems[t.Stem] = true
		}
	}

	idx.mu.Lock()
	defer idx.mu.Unlock()

	if old, exists := idx.docs[doc.ID]; exists {
		idx.removeLocked(doc.ID, old)
	}

	doc.MaxFreq = maxFreq
	doc.Terms = freq
	doc.TagStems = tagStems
	idx.docs[doc.ID] = doc

	for stem, f := range freq {
		if idx.terms[stem] == nil {
			idx.terms[stem] = &TermEntry{Postings: make(map[string]int)}
			idx.trie.Insert(stem)
			idx.bktree.Insert(stem)
		}
		entry := idx.terms[stem]
		if _, had := entry.Postings[doc.ID]; !had {
			entry.DF++
		}
		entry.Postings[doc.ID] = f
	}

	for stem := range tagStems {
		if _, exists := idx.terms[stem]; !exists {
			idx.terms[stem] = &TermEntry{Postings: make(map[string]int)}
			idx.trie.Insert(stem)
			idx.bktree.Insert(stem)
		}
		entry := idx.terms[stem]
		if _, had := entry.Postings[doc.ID]; !had {
			entry.DF++
			entry.Postings[doc.ID] = 0
		}
	}

	idx.n++
}

// RemoveDocument remove um documento do índice.
func (idx *InvertedIndex) RemoveDocument(docID string) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	doc, exists := idx.docs[docID]
	if !exists {
		return
	}
	idx.removeLocked(docID, doc)
}

// removeLocked deve ser chamado com o lock de escrita já adquirido.
func (idx *InvertedIndex) removeLocked(docID string, doc *DocMeta) {
	for stem := range doc.Terms {
		entry, ok := idx.terms[stem]
		if !ok {
			continue
		}
		delete(entry.Postings, docID)
		entry.DF--
		if entry.DF <= 0 {
			delete(idx.terms, stem)
			idx.trie.Remove(stem)
			// BK-tree: não remove (remoção é O(n); o impacto no fuzzy é desprezível)
		}
	}
	delete(idx.docs, docID)
	idx.n--
}

// Clear apaga todo o índice e reconstrói as estruturas auxiliares.
func (idx *InvertedIndex) Clear() {
	idx.mu.Lock()
	defer idx.mu.Unlock()
	idx.terms = make(map[string]*TermEntry)
	idx.docs = make(map[string]*DocMeta)
	idx.trie = NewTrie()
	idx.bktree = NewBKTree()
	idx.n = 0
}

// ExpandTerm retorna todos os stems que correspondem a um termo via:
//  1. Match exato
//  2. Prefix search (via Trie) — para termos curtos (2-6 chars)
//  3. Typo-tolerance (via BK-tree) — distância 1 para 3-4 chars, 2 para 5+
func (idx *InvertedIndex) ExpandTerm(stem string) []string {
	matches := map[string]bool{stem: true}

	if len(stem) >= 2 && len(stem) <= 6 {
		for _, t := range idx.trie.FindByPrefix(stem) {
			matches[t] = true
		}
	}

	if len(stem) >= 3 {
		maxDist := 1
		if len(stem) >= 5 {
			maxDist = 2
		}
		for _, t := range idx.bktree.Search(stem, maxDist) {
			matches[t] = true
		}
	}

	out := make([]string, 0, len(matches))
	for t := range matches {
		out = append(out, t)
	}
	return out
}

// IDF calcula log10(N / df_i) para um stem.
func (idx *InvertedIndex) IDF(stem string) float64 {
	idx.mu.RLock()
	defer idx.mu.RUnlock()

	if idx.n == 0 {
		return 0
	}
	entry, ok := idx.terms[stem]
	if !ok || entry.DF == 0 {
		return 0
	}
	return math.Log10(1 + float64(idx.n)/float64(entry.DF))
}

// Postings retorna uma cópia da postings list de um stem.
func (idx *InvertedIndex) Postings(stem string) map[string]int {
	idx.mu.RLock()
	defer idx.mu.RUnlock()

	entry, ok := idx.terms[stem]
	if !ok {
		return nil
	}
	out := make(map[string]int, len(entry.Postings))
	for k, v := range entry.Postings {
		out[k] = v
	}
	return out
}

// Doc retorna os metadados de um documento.
func (idx *InvertedIndex) Doc(docID string) *DocMeta {
	idx.mu.RLock()
	defer idx.mu.RUnlock()
	return idx.docs[docID]
}

// Preprocessor expõe o preprocessador para uso externo (highlight).
func (idx *InvertedIndex) Preprocessor() *Preprocessor {
	return idx.prep
}
