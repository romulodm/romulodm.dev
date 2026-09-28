/**
 * Path of the email logo under the site's public/ folder. It is the brand mark
 * (the same geometry as MARK_D in portfolio/components/Logo.tsx) rasterized at
 * 84px, 3x the size it is shown at, with the accent colour baked in. When the
 * mark changes, this file has to be regenerated along with the favicons.
 */
export const EMAIL_LOGO_PATH = "/email-logo.png";

/**
 * Returns the brand logo as an <img> pointing at a hosted PNG.
 *
 * Not inline SVG: Gmail, Outlook and most webmail clients strip <svg> from the
 * message body, so the header rendered empty for real recipients while the
 * admin preview (a browser) still showed it. A remote PNG is the one format
 * every client displays; clients that block images by default fall back to the
 * alt text.
 */
export function logoImg(src: string, alt: string, size = 28): string {
  return `<img src="${src}" width="${size}" height="${size}" alt="${alt}"
    style="display:block;width:${size}px;height:${size}px;border:0;outline:none;text-decoration:none;" />`;
}
