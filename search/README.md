# search — Motor de Busca em Go

Motor de busca vetorial em memória para o blog romulodm.dev.
Implementa TF-IDF + cosseno com stemming, typo-tolerance e prefix search.

## Funcionalidades

| Feature | Implementação |
|---|---|
| TF-IDF + cosseno | `engine/vector.go` |
| Stemming PT/EN | Porter Stemmer via `kljensen/snowball` |
| Prefix search | Trie (`engine/trie.go`) |
| Typo-tolerance | BK-tree + Levenshtein (`engine/bktree.go`) |
| Stopwords com peso | Peso 0.2 ao invés de remoção (`engine/preprocessor.go`) |
| Highlight stem-aware | `engine/highlight.go` |
| Thread-safe | `sync.RWMutex` no índice |

## Rotas HTTP

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/stats` | Métricas do índice |
| GET | `/search?q=...&locale=...&limit=...` | Busca |
| POST | `/index` | Indexa um documento |
| DELETE | `/index/{docID}` | Remove um documento |
| POST | `/reindex` | Substitui o índice completo |

## Rodar localmente

```bash
# Instalar dependências
go mod download

# Rodar
go run .

# Build
go build -o search-service .
```

## Docker

```bash
docker build -t romulodm-search .
docker run -p 8080:8080 romulodm-search
```

## docker-compose (produção)

```yaml
search-go:
  build:
    context: ./services/search
    dockerfile: Dockerfile
  container_name: romulodm-search-go
  restart: unless-stopped
  networks:
    - romulodm-network
```

Para dev, adiciona `ports: ["8080:8080"]`.

## Integração Next.js

Copia `search-go.ts` para `portfolio/lib/search-go.ts` e usa:

```typescript
import { goSearch, goIndex, goRemove, goReindex } from '@/lib/search-go'

// Busca
const { hits, processingTimeMs } = await goSearch('redes', 'pt', 8)

// Indexar ao publicar post
await goIndex({ id: `${postId}_pt`, slug, locale: 'pt', title, summary, excerpt, tags, publishedAt, coverImageUrl })

// Reindexar tudo (worker no startup)
await goReindex(allDocs)
```

## Variáveis de ambiente

| Variável | Default | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta do servidor |
| `SEARCH_GO_URL` | `http://search-go:8080` | URL do serviço (no Next.js/worker) |
