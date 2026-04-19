FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o search-service .

# Imagem final mínima — apenas o binário estático (~10 MB)
FROM alpine:latest
WORKDIR /app

# Diretório para o snapshot persistente (montado como volume no compose)
RUN mkdir -p /data && chown nobody:nobody /data

COPY --from=builder /app/search-service .

# Rodar como usuário não-root por segurança
USER nobody

EXPOSE 8080
CMD ["./search-service"]