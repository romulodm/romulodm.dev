#!/bin/bash
# =============================================================
#  Emite o certificado SSL pela primeira vez (rode uma única vez
#  no servidor, DEPOIS de apontar o DNS para o IP da máquina).
# =============================================================

DOMAIN="romulodm.dev"
EMAIL="seu@email.com"   # <- altere

set -e

echo "▶ Subindo nginx temporariamente para validação HTTP..."
docker compose up -d nginx

echo "▶ Emitindo certificado para $DOMAIN..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "▶ Recarregando nginx com o certificado novo..."
docker compose exec nginx nginx -s reload

echo "✅ Certificado emitido com sucesso! Renovação automática ativa."