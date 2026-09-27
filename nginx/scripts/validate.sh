#!/usr/bin/env bash
#
# Validates the nginx configuration against the real nginx binary, without
# touching anything that is currently running.
#
#   ./nginx/scripts/validate.sh
#
# It tests BOTH topologies, because they share nginx.conf but differ in what
# gets mounted and which variables exist — and that difference is exactly where
# things break:
#
#   dev  -> templates/app.dev.conf, envsubst with $NEXT_PORT. No TLS.
#           Only proxy-params.inc is mounted.
#   prod -> templates/app.conf, envsubst with $SITE_DOMAIN/$WWW_DOMAIN. TLS,
#           plus security-headers.inc and cloudflare-real-ip.inc.
#           This same topology serves staging; only the values change.
#
# In both, conf.d/ receives exactly one generated default.conf. Nothing in the
# repo's conf.d/ ends in .conf, and that is deliberate: `include conf.d/*.conf`
# would load a template verbatim and nginx would die at boot on the literal
# `${...}`.
#
# A change to the shared nginx.conf can pass in one and take down the other.
# An `include` with a fixed path pointing at a missing file is an [emerg]:
# nginx does not start and the whole site goes down. `docker compose up` gives
# no warning beforehand; this script does.
#
# TWO THINGS THIS SCRIPT HAS TO FAKE, because `nginx -t` is not a pure syntax
# check — it really opens files and really resolves names:
#
#   1. TLS certificates. It opens every path in `ssl_certificate`. Outside the
#      VPS those don't exist, so we generate throwaway self-signed ones.
#   2. Upstream hostnames. Names like `romulodm-app` only resolve inside the
#      compose network; here the container is standalone, and an unresolvable
#      name is an [emerg]. We point them all at 127.0.0.1 via /etc/hosts.
#      Nothing is ever connected to — nginx only needs the name to resolve.
#
# Run it before every commit that touches nginx/, and in CI.
#
set -euo pipefail

NGINX_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${NGINX_IMAGE:-nginx:alpine}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found — required to validate against the real nginx." >&2
  exit 2
fi

# Shared prep, injected into both runs. Kept in one place so the two topologies
# can never drift apart in how they fake certificates and hostnames.
read -r -d '' PREP <<'PREP_EOF' || true
# --- fake every hostname referenced by an upstream or a proxy_pass ----------
{
  grep -rhoE 'server[[:space:]]+[A-Za-z][A-Za-z0-9_.-]*:[0-9]+;' \
    /etc/nginx/nginx.conf /etc/nginx/conf.d 2>/dev/null \
    | sed -E 's/^server[[:space:]]+//; s/:[0-9]+;$//'
  grep -rhoE 'proxy_pass[[:space:]]+https?://[A-Za-z][A-Za-z0-9_.-]*' \
    /etc/nginx/nginx.conf /etc/nginx/conf.d 2>/dev/null \
    | sed -E 's|^proxy_pass[[:space:]]+https?://||'
} | sort -u | while read -r host; do
      [ -z "$host" ] && continue
      echo "127.0.0.1 $host" >> /etc/hosts
    done

# --- fake every certificate the config points at ----------------------------
# nginx:alpine does not ship the openssl CLI, so install it on demand. Without
# this the script used to die here silently and just print "FAILED".
if ! command -v openssl >/dev/null 2>&1; then
  apk add --no-cache openssl >/dev/null 2>&1 \
    || { echo "could not install openssl inside the container" >&2; exit 1; }
fi

openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -keyout /tmp/dummy.key -out /tmp/dummy.crt \
  -subj "/CN=validation" >/dev/null 2>&1

grep -rhoE 'ssl_certificate(_key)?[[:space:]]+[^;]+;' \
  /etc/nginx/nginx.conf /etc/nginx/conf.d 2>/dev/null \
  | sed -E 's/^ssl_certificate(_key)?[[:space:]]+//; s/;$//' \
  | sort -u \
  | while read -r path; do
      [ -z "$path" ] && continue
      mkdir -p "$(dirname "$path")"
      case "$path" in
        *key*) cp /tmp/dummy.key "$path" ;;
        *)     cp /tmp/dummy.crt "$path" ;;
      esac
    done

mkdir -p /var/www/certbot
PREP_EOF

failures=0

# Os valores abaixo sao os de PRODUCAO. Staging usa o mesmo arquivo com
# outro dominio, entao validar um valida a forma do outro.
echo "== PROD/STAGING topology: template + TLS ==========================="
if docker run --rm -i \
  -v "$NGINX_DIR/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$NGINX_DIR/templates/app.conf:/etc/nginx/templates/app.conf:ro" \
  -v "$NGINX_DIR/conf.d/proxy-params.inc:/etc/nginx/conf.d/proxy-params.inc:ro" \
  -v "$NGINX_DIR/conf.d/security-headers.inc:/etc/nginx/conf.d/security-headers.inc:ro" \
  -v "$NGINX_DIR/conf.d/cloudflare-real-ip.inc:/etc/nginx/conf.d/cloudflare-real-ip.inc:ro" \
  -e SITE_DOMAIN="${SITE_DOMAIN:-romulodm.dev}" \
  -e WWW_DOMAIN="${WWW_DOMAIN:-www.romulodm.dev}" \
  --entrypoint sh "$IMAGE" -s <<INNER
set -e

# Reproduz o entrypoint do docker-compose.prod.yml.
envsubst '\$SITE_DOMAIN \$WWW_DOMAIN' < /etc/nginx/templates/app.conf > /etc/nginx/conf.d/default.conf

$PREP
nginx -t
INNER
then
  echo "  OK"
else
  echo "  FAILED"
  failures=$((failures + 1))
fi

echo
echo "== DEV topology: no TLS, only proxy-params.inc ====================="
if docker run --rm -i \
  -v "$NGINX_DIR/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$NGINX_DIR/templates/app.dev.conf:/etc/nginx/templates/app.dev.conf:ro" \
  -v "$NGINX_DIR/conf.d/proxy-params.inc:/etc/nginx/conf.d/proxy-params.inc:ro" \
  -e NEXT_PORT="${NEXT_PORT:-3000}" \
  --entrypoint sh "$IMAGE" -s <<INNER
set -e

# Reproduces the entrypoint in docker-compose.dev.nginx.yml: conf.d contains
# only the mounted proxy-params.inc plus the envsubst output. Any fixed-path
# include pointing at another .inc breaks right here.
#
# The glob is *.conf on purpose — trying to delete the read-only mounted .inc
# would fail.
rm -f /etc/nginx/conf.d/*.conf
envsubst '\$NEXT_PORT' < /etc/nginx/templates/app.dev.conf > /etc/nginx/conf.d/default.conf

# Runs AFTER envsubst: the generated default.conf is what declares
# app_dev_upstream, so the hostname scan has to see it.
$PREP
nginx -t
INNER
then
  echo "  OK"
else
  echo "  FAILED"
  failures=$((failures + 1))
fi

echo
if [ "$failures" -eq 0 ]; then
  echo "Both topologies load."
else
  echo "$failures topology/topologies failed." >&2
  exit 1
fi
