/**
 * MapLibre's stylesheet (~84KB unminified), plus the site's overrides, as a
 * module of its own so LocationTile can load it with `import()` next to the
 * library.
 *
 * Imported at the top of LocationTile, the sheet was part of the home's
 * render-blocking CSS: every visitor waited for it before the first paint,
 * though the map is only created when the bento gets near the viewport.
 * Order matters: the overrides must come after the library sheet.
 */
import 'maplibre-gl/dist/maplibre-gl.css';
import './maplibre-overrides.css';

export {};
