# ============================================================
#  Shared proxy headers for every upstream (Next.js app, MinIO...).
#
#  Include this in any `location` that does a `proxy_pass`. It carries the
#  original request identity (host, client IP, scheme) to the backend, which
#  would otherwise only see nginx.
#
#  WHY THE .inc EXTENSION:
#  nginx.conf includes `conf.d/*.conf`. If this file ended in .conf it would be
#  loaded as a standalone config block at the wrong level and nginx would
#  refuse to start. The .inc extension keeps it out of that glob.
# ============================================================

# HTTP/1.1 towards the upstream. Required for two things: connection reuse
# (the `keepalive` in the upstream blocks) and WebSocket upgrades.
proxy_http_version 1.1;

# WebSocket / HMR support, safe for normal requests too.
#
# $connection_upgrade is defined by a `map` in nginx.conf: it resolves to
# "upgrade" only when the client actually sent an Upgrade header, and to an
# empty string otherwise. Empty means nginx omits the header entirely, which is
# what lets keepalive connection reuse work.
#
# Hardcoding `Connection "upgrade"` here (a common copy-paste) would break
# keepalive on 100% of normal requests to gain WebSocket support on ~0% of them.
proxy_set_header Upgrade    $http_upgrade;
proxy_set_header Connection $connection_upgrade;

# Original request identity. Without these the app sees "romulodm-nginx" as the
# host and the nginx container IP as the visitor.
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host  $host;

# Timeouts. `read` is the generous one because a cold Next.js route can take a
# few seconds; `connect` is short because the upstream is one hop away inside
# the Docker network — if it doesn't answer fast, it's down, not slow.
proxy_connect_timeout 10s;
proxy_send_timeout    30s;
proxy_read_timeout    60s;
