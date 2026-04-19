package engine

import (
	"regexp"
	"strings"
)

// wordBoundary encontra todas as palavras (sequências de letras) no texto.
var wordBoundary = regexp.MustCompile(`\p{L}+`)

// Highlight marca as palavras do texto cujo stem corresponde a algum
// stem da query. Preserva o case e os acentos originais do texto.
//
// O algoritmo percorre o texto de trás para frente para que as inserções
// de "<mark>" e "</mark>" não invalidem os índices das posições anteriores.
func Highlight(text string, queryTokens []Token, prep *Preprocessor, locale string) string {
	if text == "" || len(queryTokens) == 0 {
		return text
	}

	// Constrói conjunto de stems da query
	targetStems := make(map[string]bool, len(queryTokens))
	for _, t := range queryTokens {
		targetStems[t.Stem] = true
	}

	// Encontra os índices de todas as palavras no texto
	locs := wordBoundary.FindAllStringIndex(text, -1)

	result := text
	for i := len(locs) - 1; i >= 0; i-- {
		start, end := locs[i][0], locs[i][1]
		word := text[start:end]

		// Normaliza e stemmiza a palavra para comparar com os stems da query
		normalized := strings.ToLower(word)
		normalized = prep.normalize(normalized)
		normalized = strings.TrimSpace(normalized)
		stem := prep.Stem(normalized, locale)

		if targetStems[stem] {
			result = result[:start] + "<mark>" + word + "</mark>" + result[end:]
		}
	}
	return result
}
