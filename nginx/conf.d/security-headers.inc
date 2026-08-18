# ============================================================
#  Shared security response headers.
#
#  WHY THIS IS AN INCLUDE INSTEAD OF JUST A BLOCK IN `server`:
#
#  In nginx, `add_header` is NOT cumulative across levels. A `location` that
#  declares any `add_header` of its own SILENTLY DISCARDS every `add_header`
#  inherited from the enclosing `server` block. Nothing warns you — not even
#  `nginx -t`.
#
#  So every location that needs to set a Cache-Control or a debug header must
#  re-include this file, otherwise that particular response goes out with zero
#  security headers.
#
#  Tip: if a location only needs to set a content type, prefer `default_type`
#  over `add_header Content-Type` — `default_type` doesn't trigger the reset.
#
#  WHY THE .inc EXTENSION: see the note in proxy-params.inc.
# ============================================================

# Don't let other sites frame this one (clickjacking).
add_header X-Frame-Options        "SAMEORIGIN"                      always;

# Trust the declared Content-Type; don't let the browser guess and, say, run a
# user-uploaded image as a script.
add_header X-Content-Type-Options "nosniff"                         always;

# Legacy XSS filter. Modern browsers ignore it; harmless and still useful for
# old ones.
add_header X-XSS-Protection       "1; mode=block"                   always;

# Send the full URL as referrer only to same-origin destinations; cross-origin
# gets just the domain.
add_header Referrer-Policy        "strict-origin-when-cross-origin" always;

# Deny browser APIs this site never uses.
add_header Permissions-Policy     "camera=(), microphone=(), geolocation=()" always;

# Keep staging out of search results.
#
# $robots_tag comes from a `map $host` in nginx.conf: "noindex, nofollow" for
# staging.*, empty everywhere else. nginx omits a header whose value is an empty
# variable, so production pays nothing for this line.
#
# It lives HERE rather than in the server block so it travels with every
# include — otherwise each location that sets its own Cache-Control would
# silently drop the noindex, and staging assets would become indexable.
#
# This is the second barrier. The first is the app's own robots.txt, gated by
# ROBOTS_ALLOW_INDEXING. Both are worth having: robots.txt is an instruction a
# crawler chooses to obey, while this header rides on every response. One
# `.env` with the wrong value should not be enough to get staging indexed and
# competing with the real site for the same content.
add_header X-Robots-Tag           $robots_tag                       always;

# HSTS — tells the browser to refuse plain HTTP for this domain.
#
# Enable only after HTTPS is confirmed solid, because the browser remembers the
# rule for the whole `max-age` and there is no easy way to undo it for visitors
# who already cached it. Start with something short (e.g. 300) and raise it.
# add_header Strict-Transport-Security "max-age=63072000" always;
