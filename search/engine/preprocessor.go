package engine

import (
	"strings"
	"unicode"

	"github.com/kljensen/snowball"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// Stopwords — não são removidas, recebem peso reduzido na indexação.
// Isso permite buscar "the" e encontrar resultados, porém com score menor.
var stopwordsSet = map[string]bool{
	"a": true, "as": true, "o": true, "os": true, "um": true, "uma": true,
	"de": true, "do": true, "da": true, "dos": true, "das": true,
	"em": true, "no": true, "na": true, "nos": true, "nas": true,
	"por": true, "para": true, "com": true, "que": true, "se": true,
	"mais": true, "mas": true, "ou": true, "ao": true, "aos": true,
	"the": true, "is": true, "it": true, "of": true, "to": true,
	"and": true, "or": true, "in": true, "on": true, "at": true,
	"for": true, "with": true, "this": true, "that": true, "be": true,
	"an": true, "by": true, "was": true, "were": true,
}

// Token representa uma palavra após pré-processamento.
type Token struct {
	Raw    string  // palavra original normalizada (sem acentos, lowercase)
	Stem   string  // stem via Porter/Snowball
	IsStop bool    // é stopword?
	Weight float64 // peso: 1.0 normal, 0.2 stopword
}

// Preprocessor cuida de normalização, tokenização e stemming.
type Preprocessor struct{}

func NewPreprocessor() *Preprocessor {
	return &Preprocessor{}
}

// normalize remove acentos, converte para lowercase e substitui
// caracteres não-alfanuméricos por espaço.
func (p *Preprocessor) normalize(text string) string {
	t := transform.Chain(norm.NFD, transform.RemoveFunc(func(r rune) bool {
		return unicode.Is(unicode.Mn, r) // remove combining marks (acentos)
	}), norm.NFC)

	normalized, _, _ := transform.String(t, strings.ToLower(text))

	var sb strings.Builder
	for _, r := range normalized {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			sb.WriteRune(r)
		} else {
			sb.WriteRune(' ')
		}
	}
	return sb.String()
}

// Stem aplica Porter Stemmer via Snowball.
// Tenta o idioma informado; em caso de erro retorna a palavra original.
func (p *Preprocessor) Stem(word, locale string) string {
	lang := "portuguese"
	if locale == "en" {
		lang = "english"
	}
	s, err := snowball.Stem(word, lang, true)
	if err != nil {
		return word
	}
	return s
}

// Tokenize retorna a lista de tokens com stem, flag de stopword e peso.
// Palavras com menos de 2 caracteres são descartadas.
func (p *Preprocessor) Tokenize(text, locale string) []Token {
	normalized := p.normalize(text)
	fields := strings.Fields(normalized)

	tokens := make([]Token, 0, len(fields))
	for _, w := range fields {
		if len(w) < 2 {
			continue
		}
		isStop := stopwordsSet[w]
		weight := 1.0
		if isStop {
			weight = 0.2
		}
		tokens = append(tokens, Token{
			Raw:    w,
			Stem:   p.Stem(w, locale),
			IsStop: isStop,
			Weight: weight,
		})
	}
	return tokens
}

// Stems é um atalho que retorna apenas os stems — usado na indexação.
func (p *Preprocessor) Stems(text, locale string) []string {
	tokens := p.Tokenize(text, locale)
	out := make([]string, 0, len(tokens))
	for _, t := range tokens {
		out = append(out, t.Stem)
	}
	return out
}
