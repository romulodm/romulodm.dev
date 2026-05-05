package engine

import "math"

// VectorModel implementa TF-IDF e similaridade por cosseno.
// Utiliza os termos expandidos (prefix + fuzzy) com pesos degradados,
// garantindo que matches exatos sempre pontuem mais alto que variants.
type VectorModel struct {
	idx *InvertedIndex
}

func NewVectorModel(idx *InvertedIndex) *VectorModel {
	return &VectorModel{idx: idx}
}

// docWeight calcula o peso TF-IDF do stem i no documento j:
//
//	tf_{i,j}  = freq_{i,j} / max_l(freq_{l,j})
//	idf_i     = log10(N / df_i)
//	weight    = tf * idf
func (v *VectorModel) docWeight(stem, docID string) float64 {
	doc := v.idx.Doc(docID)
	if doc == nil {
		return 0
	}

	if doc.TagStems[stem] {
		return v.idx.IDF(stem)
	}

	postings := v.idx.Postings(stem)
	freq, ok := postings[docID]
	if !ok || freq == 0 || doc.MaxFreq == 0 {
		return 0
	}

	tf := float64(freq) / float64(doc.MaxFreq)
	return tf * v.idx.IDF(stem)
}

// QueryTerm representa um stem expandido com seu peso final na consulta.
type QueryTerm struct {
	Stem   string
	Weight float64
}

// BuildQueryTerms expande cada token da query em suas variantes
// (prefix + fuzzy) e atribui pesos degradados às variantes:
//
//   - Match exato:    peso = token.Weight (1.0 normal, 0.2 stopword)
//   - Variant prefix/fuzzy: peso = token.Weight × 0.7
//
// Se a mesma variante aparecer via dois tokens, mantém o maior peso.
func (v *VectorModel) BuildQueryTerms(tokens []Token) []QueryTerm {
	seen := make(map[string]float64)

	for _, token := range tokens {
		base := token.Weight

		addOrUpdate(seen, token.Stem, base)

		for _, variant := range v.idx.ExpandTerm(token.Stem) {
			if variant == token.Stem {
				continue
			}
			addOrUpdate(seen, variant, base*0.7)
		}
	}

	out := make([]QueryTerm, 0, len(seen))
	for stem, w := range seen {
		out = append(out, QueryTerm{Stem: stem, Weight: w})
	}
	return out
}

func addOrUpdate(m map[string]float64, k string, v float64) {
	if cur, ok := m[k]; !ok || v > cur {
		m[k] = v
	}
}

// Candidates retorna os docIDs de todos os documentos que contêm
// ao menos um stem expandido da query.
func (v *VectorModel) Candidates(queryTerms []QueryTerm) map[string]bool {
	out := make(map[string]bool)
	for _, qt := range queryTerms {
		for docID := range v.idx.Postings(qt.Stem) {
			out[docID] = true
		}
	}
	return out
}

// CosineSimilarity calcula sim(d_j, q) = (d_j · q) / (|d_j| × |q|).
// Usa os pesos expandidos da query para que variantes contribuam
// proporcionalmente ao seu grau de similaridade com o termo original.
func (v *VectorModel) CosineSimilarity(docID string, queryTerms []QueryTerm) float64 {
	var dot, docMag, queryMag float64

	for _, qt := range queryTerms {
		wd := v.docWeight(qt.Stem, docID)
		wq := qt.Weight * v.idx.IDF(qt.Stem)

		dot += wd * wq
		docMag += wd * wd
		queryMag += wq * wq
	}

	denom := math.Sqrt(docMag) * math.Sqrt(queryMag)
	if denom == 0 {
		return 0
	}
	return dot / denom
}
