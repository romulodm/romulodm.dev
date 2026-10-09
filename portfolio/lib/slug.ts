/**
 * URL slug normalization for blog posts. Kept free of server imports so the
 * post editor can show, while the author types, the exact slug the API will
 * store.
 */

export const MAX_SLUG_LENGTH = 80;

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // strip accents
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, MAX_SLUG_LENGTH)
      // Cutting at the length limit can leave a trailing hyphen, and a typed
      // slug can start or end with one; neither belongs in a URL segment.
      .replace(/^-+|-+$/g, "")
  );
}
