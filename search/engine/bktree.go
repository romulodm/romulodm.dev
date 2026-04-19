package engine

import "sync"

// BKTree implementa typo-tolerance via distância de Levenshtein.
//
// Propriedade central: dado um nó com termo T e distância d para o pai,
// todos os filhos estão agrupados por sua distância a T. Isso permite
// podar a busca para apenas os subárvores dentro do raio de tolerância,
// resultando em ~O(log n) ao invés de O(n).
type bkNode struct {
	term     string
	children map[int]*bkNode
}

// BKTree é thread-safe para leituras e escritas concorrentes.
type BKTree struct {
	mu   sync.RWMutex
	root *bkNode
}

func NewBKTree() *BKTree {
	return &BKTree{}
}

// levenshtein calcula a distância de edição entre duas strings.
// Usa programação dinâmica com duas linhas para economizar memória.
func levenshtein(a, b string) int {
	ra, rb := []rune(a), []rune(b)
	la, lb := len(ra), len(rb)

	if la == 0 {
		return lb
	}
	if lb == 0 {
		return la
	}

	prev := make([]int, lb+1)
	curr := make([]int, lb+1)

	for j := 0; j <= lb; j++ {
		prev[j] = j
	}

	for i := 1; i <= la; i++ {
		curr[0] = i
		for j := 1; j <= lb; j++ {
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			curr[j] = min3(prev[j]+1, curr[j-1]+1, prev[j-1]+cost)
		}
		prev, curr = curr, prev
	}
	return prev[lb]
}

func min3(a, b, c int) int {
	if a < b {
		if a < c {
			return a
		}
		return c
	}
	if b < c {
		return b
	}
	return c
}

// Insert adiciona um termo à BK-tree.
// Termos duplicados são ignorados silenciosamente.
func (t *BKTree) Insert(term string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.root == nil {
		t.root = &bkNode{term: term, children: make(map[int]*bkNode)}
		return
	}

	node := t.root
	for {
		d := levenshtein(term, node.term)
		if d == 0 {
			return // duplicata
		}
		child, ok := node.children[d]
		if !ok {
			node.children[d] = &bkNode{term: term, children: make(map[int]*bkNode)}
			return
		}
		node = child
	}
}

// Search retorna todos os termos dentro de maxDist edições de query.
// maxDist=1 tolera 1 erro (troca/inserção/remoção de caractere).
// maxDist=2 tolera 2 erros — usar com cuidado para evitar ruído.
func (t *BKTree) Search(query string, maxDist int) []string {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if t.root == nil {
		return nil
	}

	var results []string

	var walk func(node *bkNode)
	walk = func(node *bkNode) {
		d := levenshtein(query, node.term)
		if d <= maxDist {
			results = append(results, node.term)
		}
		// Poda: só visita filhos com distância em [d-maxDist, d+maxDist]
		lo, hi := d-maxDist, d+maxDist
		for childDist, child := range node.children {
			if childDist >= lo && childDist <= hi {
				walk(child)
			}
		}
	}

	walk(t.root)
	return results
}
