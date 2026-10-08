/**
 * Post media is stored as a bare object key (`posts/<postId>/<name>.<ext>`):
 * no origin, no bucket. The site serves every key under `/media/`. This is the
 * worker's copy of portfolio/lib/media.ts; the worker cannot import from the
 * portfolio app, and the convention is a single path prefix, so the two must
 * simply agree on it.
 *
 * Emails are read outside the site, so the worker always needs the absolute
 * form.
 */
export function absoluteMediaUrl(key: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/media/${key}`;
}
