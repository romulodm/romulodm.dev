package engine

import "sync"

// trieNode é um nó da árvore trie.
// Cada nó armazena todos os termos completos que passam por ele,
// permitindo busca por prefixo em O(m) onde m = len(prefix).
type trieNode struct {
	children map[rune]*trieNode
	terms    map[string]bool
}

// Trie implementa prefix search eficiente para o vocabulário do índice.
type Trie struct {
	mu   sync.RWMutex
	root *trieNode
}

func NewTrie() *Trie {
	return &Trie{root: newTrieNode()}
}

func newTrieNode() *trieNode {
	return &trieNode{
		children: make(map[rune]*trieNode),
		terms:    make(map[string]bool),
	}
}

// Insert adiciona um termo ao trie.
func (t *Trie) Insert(term string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	node := t.root
	for _, r := range term {
		if node.children[r] == nil {
			node.children[r] = newTrieNode()
		}
		node = node.children[r]
		node.terms[term] = true
	}
}

// Remove remove um termo do trie.
func (t *Trie) Remove(term string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	node := t.root
	for _, r := range term {
		next, ok := node.children[r]
		if !ok {
			return
		}
		delete(next.terms, term)
		node = next
	}
}

// FindByPrefix retorna todos os termos que começam com o prefixo dado.
// Retorna nil se o prefixo não existir no vocabulário.
func (t *Trie) FindByPrefix(prefix string) []string {
	t.mu.RLock()
	defer t.mu.RUnlock()

	node := t.root
	for _, r := range prefix {
		next, ok := node.children[r]
		if !ok {
			return nil
		}
		node = next
	}

	result := make([]string, 0, len(node.terms))
	for term := range node.terms {
		result = append(result, term)
	}
	return result
}
