/**
 * Post media (covers and images inside the markdown) lives in MinIO, but the
 * database never stores where. It stores the object key alone, for example
 * `posts/<postId>/cover-<hash>.jpg`: no origin, no bucket name.
 *
 * Storing absolute URLs tied every row to the host that happened to serve the
 * upload. A cover uploaded in dev was saved as `http://localhost:9000/...`,
 * which only resolves on the machine running MinIO; opened from a phone over
 * Tailscale, `localhost` is the phone itself and the image breaks. The same
 * thing happens to any stored URL after a domain or storage change.
 *
 * `/media/*` is routed to the bucket by whatever sits in front of the app:
 *   - production: an nginx `location ^~ /media/` proxies straight to MinIO
 *     (nginx/templates/app.conf), without going through Node;
 *   - Next.js itself: a rewrite in next.config.js covers `next dev`, and the
 *     image optimizer, whose internal fetch of `/media/...` never passes
 *     through nginx.
 */

/** URL path every media object is served under. */
export const MEDIA_PATH_PREFIX = '/media/'

/**
 * Largest image the editor accepts, in bytes. Matches nginx's
 * `client_max_body_size 10M` (nginx/templates/app.conf), which rejects a
 * bigger upload body before it reaches the app.
 */
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024

/**
 * Resolves a storage key to a public URL. Keeping the origin out of the
 * database means stored data survives host, domain and storage changes.
 *
 * The result is a relative path, so it works unchanged on localhost:3000, on
 * a Tailscale IP and on the production domain. Contexts that need an absolute
 * URL (Open Graph, RSS, email) wrap it with `absoluteUrl()` from lib/seo.ts.
 */
export function mediaUrl(key: string): string {
  return `${MEDIA_PATH_PREFIX}${key}`
}

/** True when `src` points at our own media path, i.e. came from mediaUrl(). */
export function isMediaUrl(src: string): boolean {
  return src.startsWith(MEDIA_PATH_PREFIX)
}
