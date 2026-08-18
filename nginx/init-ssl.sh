#!/usr/bin/env bash
# =============================================================
#  First-time TLS certificate issuance.
#
#  Run this ONCE on the server, AFTER pointing the domain's DNS at the machine's
#  IP. Renewal afterwards is automatic: the certbot container in
#  docker-compose.prod.yml re-checks every 12h.
#
#  THE CHICKEN-AND-EGG PROBLEM THIS SCRIPT AVOIDS:
#  templates/app.conf references certificate files, and nginx refuses to start when
#  they are missing. But the usual Certbot flow (--webroot) needs a running
#  nginx to serve /.well-known/acme-challenge/. On a fresh server neither can go
#  first.
#
#  The way out: issue the first certificate with --standalone, where Certbot
#  binds port 80 itself and needs no web server at all. Once the real files
#  exist, nginx starts normally and every later renewal uses --webroot through
#  the already-running nginx.
#
#  Usage — production:
#    EMAIL=you@example.com ./nginx/init-ssl.sh
#
#  Usage — staging (subdomains have no www):
#    EMAIL=you@example.com WWW=0 ./nginx/init-ssl.sh
#
#  DOMAIN defaults to SITE_DOMAIN from the .env of this machine, so each VPS
#  issues the certificate for its own hostname without extra arguments — the
#  same .env that tells nginx which domain to serve.
#
#  REHEARSE FIRST. Let's Encrypt allows only 5 failed validations per hostname
#  per hour, and a cold setup rarely works on the first try. Run it once with
#  DRY_RUN=1: it exercises the entire flow against Let's Encrypt's staging
#  server, which issues an untrusted certificate but spends no quota.
#
#    EMAIL=you@example.com DRY_RUN=1 ./nginx/init-ssl.sh   # rehearsal
#    EMAIL=you@example.com ./nginx/init-ssl.sh             # for real
#
#  Deliberately NOT called STAGING: this project has an environment named
#  `staging`, and `STAGING=1` on the staging VPS would read as "this is the
#  staging server" rather than "do not spend real quota". Two different
#  meanings behind one word is how someone burns the rate limit by accident.
#
#  After a successful rehearsal, delete the fake certificate before the real
#  run — Certbot would otherwise see the path as already taken:
#    docker compose -f docker-compose.prod.yml run --rm --entrypoint sh certbot \
#      -c "rm -rf /etc/letsencrypt/{live,archive,renewal}/<domain>*"
# =============================================================
set -euo pipefail

# Le o SITE_DOMAIN do .env sem executar o arquivo (ele tem senhas dentro).
DOMAIN_FROM_ENV="$(sed -n 's/^SITE_DOMAIN=//p' .env 2>/dev/null | tr -d '"'"'"'\r' | head -1 || true)"
DOMAIN="${DOMAIN:-${DOMAIN_FROM_ENV:-romulodm.dev}}"
EMAIL="${EMAIL:-}"
WWW="${WWW:-1}"                 # also request www.<domain>; set WWW=0 for subdomains
DRY_RUN="${DRY_RUN:-0}"         # 1 = rehearsal against Let's Encrypt staging server
COMPOSE="docker compose -f docker-compose.prod.yml"

if [ -z "$EMAIL" ]; then
  echo "ERROR: set EMAIL — Let's Encrypt uses it for expiry warnings." >&2
  echo "  EMAIL=you@example.com ./nginx/init-ssl.sh" >&2
  exit 1
fi

# Always run from the repository root, whatever directory this was invoked from.
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DOMAIN_ARGS=(-d "$DOMAIN")
[ "$WWW" = "1" ] && DOMAIN_ARGS+=(-d "www.$DOMAIN")

EXTRA_ARGS=()
if [ "$DRY_RUN" = "1" ]; then
  EXTRA_ARGS+=(--staging)
  echo "MODO ENSAIO: o certificado emitido NAO sera confiavel no navegador."
fi

echo "Dominio: ${DOMAIN_ARGS[*]//-d /}"

echo "▶ Stopping nginx (if running) so Certbot can bind port 80..."
# --standalone runs its own listener; anything already holding :80 makes it fail.
$COMPOSE stop nginx 2>/dev/null || true

echo "▶ Requesting the certificate for $DOMAIN..."
# -p 80:80 publishes the port for this one-off container only. The --entrypoint
# override is needed because the certbot service normally runs a renewal loop.
$COMPOSE run --rm -p 80:80 --entrypoint certbot certbot certonly \
  --standalone \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  "${EXTRA_ARGS[@]}" \
  "${DOMAIN_ARGS[@]}"

echo "▶ Starting nginx with the new certificate..."
$COMPOSE up -d nginx

# `nginx -s reload` with a broken config silently keeps the old one running, so
# check the config explicitly and fail loudly instead.
echo "▶ Verifying the loaded configuration..."
$COMPOSE exec nginx nginx -t

echo "✅ Certificate issued for $DOMAIN. Automatic renewal is active."
echo "   The renewal loop passes --webroot explicitly, which overrides the"
echo "   'standalone' authenticator recorded during this first issuance."
