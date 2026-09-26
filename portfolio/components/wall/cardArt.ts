// components/wall/cardArt.ts

/**
 * Deterministic background art for wall message cards.
 *
 * The same idea as an identicon, applied to a card instead of an avatar: the
 * author id and the message text are hashed into a seed, the seed drives a
 * PRNG, and the PRNG picks the parameters of a fixed composition. Same author
 * and same text give the same card on every render, on the server and in the
 * browser, with nothing stored besides the message itself.
 *
 * Colour comes from a hand-picked list of palettes, never from free HSL. A
 * random hue with a random offset is how the first version ended up with
 * brown, khaki and red-on-orange cards: most points of the colour wheel look
 * bad next to most other points. A curated palette can only produce
 * combinations someone already looked at. The seed picks the palette and the
 * order its colours are used in.
 *
 * Each style is a fixed composition where the seed only picks parameters
 * (which corner, how many rings, the wave phase), never free positions. A
 * narrow generative space is what keeps every seed looking intentional.
 *
 * Output is an SVG string meant to be used as a `data:` URI in a CSS
 * `background-image`. That is deliberate: a data URI is its own document, so
 * the gradient and filter ids below can never collide with another card's on
 * the same page. Inlining the markup with dangerouslySetInnerHTML would put
 * every card's `<defs>` in one shared id namespace, and every card would
 * paint with the first card's gradient.
 */

/* ------------------------------------------------------------------ seed */

/** 32-bit FNV-1a. Not cryptographic: only distribution matters here. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, seedable PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const int = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
const f = (n: number) => n.toFixed(1);

function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* --------------------------------------------------------------- palettes */

/**
 * Five colours each. Index 0 is always the ground: every style paints it
 * first and it is what sits behind the text, so the text colour is decided
 * from it (see `inkFor`). Index 1 is the ground's family colour, the same
 * hue lighter or darker, and is what styles tint the ground towards. The
 * last three are accents, shuffled per seed.
 *
/**
 * Split by tone because the visitor picks light or dark when publishing, and
 * the text then picks a palette inside that group. Dark grounds carry white
 * text and light grounds near-black text; that is computed by `inkFor`, not
 * declared here, so adding a palette cannot break legibility.
 */
const PALETTES: Record<"dark" | "light", readonly (readonly string[])[]> = {
  dark: [
    ["#1e1b4b", "#4f46e5", "#a855f7", "#ec4899", "#fb923c"], // dusk
    ["#082f49", "#0369a1", "#06b6d4", "#5eead4", "#a5f3fc"], // lagoon
    ["#022c22", "#047857", "#34d399", "#bef264", "#fde68a"], // fern
    ["#3b0764", "#7e22ce", "#c084fc", "#f0abfc", "#fda4af"], // orchid
    ["#2e1065", "#db2777", "#f97316", "#fbbf24", "#fde68a"], // sunset
    ["#0f172a", "#1d4ed8", "#60a5fa", "#c7d2fe", "#f472b6"], // midnight
    ["#134e4a", "#0d9488", "#5eead4", "#818cf8", "#c4b5fd"], // aurora
    ["#4c0519", "#be123c", "#fb7185", "#fdba74", "#fef9c3"], // rosewood
    ["#2563eb", "#34d399", "#f472b6", "#f97316", "#22d3ee"], // bento, left card
    ["#6d28d9", "#a855f7", "#f0abfc", "#e879f9", "#c084fc"], // bento, right card
  ],
  light: [
    ["#fdf2f8", "#fbcfe8", "#f9a8d4", "#c4b5fd", "#a5f3fc"], // sorbet
    ["#fff7ed", "#fed7aa", "#fdba74", "#fb7185", "#fcd34d"], // apricot
    ["#f0fdf4", "#bbf7d0", "#6ee7b7", "#7dd3fc", "#c7d2fe"], // mint
    ["#f5f3ff", "#ddd6fe", "#c4b5fd", "#f5d0fe", "#fbcfe8"], // lilac
    ["#eff6ff", "#bfdbfe", "#93c5fd", "#fde68a", "#fca5a5"], // morning
    ["#ecfeff", "#a5f3fc", "#67e8f9", "#fda4af", "#fde68a"], // seafoam
    ["#fff1f2", "#fecdd3", "#fda4af", "#c4b5fd", "#99f6e4"], // blush
    ["#fefce8", "#fef08a", "#fdba74", "#f9a8d4", "#a5b4fc"], // lemonade
  ],
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const INK_LIGHT = "#ffffff";
const INK_DARK = "#18181b";

/** Whichever of white or near-black reads better on the given ground. */
function inkFor(ground: string): string {
  const l = luminance(ground);
  return contrast(l, 1) >= contrast(l, luminance(INK_DARK)) ? INK_LIGHT : INK_DARK;
}

/* ----------------------------------------------------------------- canvas */

/**
 * The art box. The footer (avatar, name, date) covers roughly the bottom 60
 * units, so compositions keep their interest in the top ~160. The SVG uses
 * `slice`, which crops instead of stretching when a long message makes the
 * card taller than this ratio.
 */
const W = 400;
const H = 220;
const VISIBLE_H = 160;

/**
 * What each style returns: the body of the <svg> plus, optionally, <defs>.
 * `ground` is the colour behind the text, which decides the ink.
 */
interface Drawn {
  defs?: string;
  body: string;
  ground: string;
  /** Overrides the ink derived from `ground`, for styles with no one ground. */
  ink?: string;
}

type Palette = readonly string[];
type Style = (rng: Rng, p: Palette) => Drawn;

/* ----------------------------------------------------------------- styles */

/**
 * A mesh gradient: large circles blurred into each other, with a film grain
 * on top. The grain is an feTurbulence whose `seed` attribute also comes
 * from the rng, so it is as deterministic as the rest.
 */
const mesh: Style = (rng, p) => {
  const spots = [1, 2, 3, 4].map((i) => ({
    cx: between(rng, -0.1, 1.1) * W,
    cy: between(rng, -0.1, 0.9) * VISIBLE_H,
    r: between(rng, 0.28, 0.42) * W,
    color: p[i],
  }));
  const grainSeed = int(rng, 1, 999);

  // Unlike the other styles, the mesh has no single colour behind the text:
  // a dark ground can show on the left of a message while a pastel spot sits
  // on the right. So the ink is not judged on one colour. The blurred field
  // is estimated at five points along the line the text occupies, and the
  // ink that keeps the best worst-case contrast across them wins.
  const colourAt = (x: number, y: number) => {
    let acc = p[0];
    for (const s of spots) {
      const d = Math.hypot(x - s.cx, y - s.cy) / s.r;
      acc = mix(acc, s.color, 0.85 * Math.exp(-d * d * 1.2));
    }
    return acc;
  };
  const samples = [0.2, 0.35, 0.5, 0.65, 0.8].map((t) => luminance(colourAt(t * W, VISIBLE_H * 0.4)));
  const worst = (ink: string) => Math.min(...samples.map((l) => contrast(l, luminance(ink))));

  return {
    defs:
      `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="48"/></filter>` +
      `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${grainSeed}"/>` +
      `<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .09 0"/></filter>`,
    body:
      `<rect width="${W}" height="${H}" fill="${p[0]}"/>` +
      `<g filter="url(#b)" opacity=".85">${spots.map((s) => `<circle cx="${f(s.cx)}" cy="${f(s.cy)}" r="${f(s.r)}" fill="${s.color}"/>`).join("")}</g>` +
      `<rect width="${W}" height="${H}" filter="url(#n)"/>`,
    ground: p[0],
    ink: worst(INK_LIGHT) >= worst(INK_DARK) ? INK_LIGHT : INK_DARK,
  };
};

/**
 * Sunburst: thin rays from a point below the card, alternating ground and a
 * colour only a little lighter, with a sun on the horizon. Low contrast
 * between rays on purpose, the text sits right on them.
 */
const rays: Style = (rng, p) => {
  const ox = between(rng, 0.25, 0.75) * W;
  const oy = VISIBLE_H + 20;
  const count = int(rng, 14, 22);
  const spread = Math.PI;
  // Rays are a tint of the ground, not a blend with another palette colour:
  // purple blended towards yellow goes through brown.
  const dark = inkFor(p[0]) === INK_LIGHT;
  const rayColor = dark ? mix(p[0], "#ffffff", 0.1) : mix(p[0], p[1], 0.4);
  let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
  for (let i = 0; i < count; i += 2) {
    const a0 = Math.PI + (i / count) * spread;
    const a1 = Math.PI + ((i + 1) / count) * spread;
    const R = 600;
    body += `<path d="M${f(ox)} ${oy} L${f(ox + R * Math.cos(a0))} ${f(oy + R * Math.sin(a0))} L${f(ox + R * Math.cos(a1))} ${f(oy + R * Math.sin(a1))}Z" fill="${rayColor}"/>`;
  }
  body += `<circle cx="${f(ox)}" cy="${oy}" r="${f(between(rng, 44, 62))}" fill="${p[2]}"/>`;
  return { body, ground: mix(p[0], rayColor, 0.5) };
};

/**
 * Busy patterns (truchet, lifehash) would fight with the text,
 * so they get a calm spot behind it: a radial fade of the ground colour
 * centred where the message sits. The pattern stays at full strength at the
 * edges and dissolves towards the middle.
 */
const HALO_DEF = (ground: string) =>
  `<radialGradient id="h" cx=".5" cy=".36" r=".48">` +
  `<stop offset=".35" stop-color="${ground}" stop-opacity=".92"/>` +
  `<stop offset="1" stop-color="${ground}" stop-opacity="0"/>` +
  `</radialGradient>`;
const HALO = `<rect width="${W}" height="${H}" fill="url(#h)"/>`;

/**
 * Truchet tiles: a grid of squares, each holding two quarter-arcs that join
 * the midpoints of its edges, in one of two orientations. Every arc meets an
 * arc of the neighbouring tile, so random orientations still read as one
 * continuous path instead of noise. The seed picks orientations and scale.
 */
const truchet: Style = (rng, p) => {
  const s = pick(rng, [28, 32, 36, 40]);
  const r = s / 2;
  const cols = Math.ceil(W / s);
  const rows = Math.ceil(H / s);
  let d = "";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * s;
      const y = row * s;
      if (rng() < 0.5) {
        // Arcs around the top-left and bottom-right corners.
        d += `M${x + r} ${y}A${r} ${r} 0 0 1 ${x} ${y + r}`;
        d += `M${x + s} ${y + r}A${r} ${r} 0 0 0 ${x + r} ${y + s}`;
      } else {
        // Arcs around the top-right and bottom-left corners.
        d += `M${x + r} ${y}A${r} ${r} 0 0 0 ${x + s} ${y + r}`;
        d += `M${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y + s}`;
      }
    }
  }
  return {
    defs: HALO_DEF(p[0]),
    body:
      `<rect width="${W}" height="${H}" fill="${p[0]}"/>` +
      `<path d="${d}" fill="none" stroke="${p[1]}" stroke-width="${f(s * 0.3)}" stroke-linecap="round"/>` +
      HALO,
    ground: p[0],
  };
};

/**
 * A 1D height profile as a sum of three sines. Cheaper than value noise and,
 * at card size, indistinguishable from it for a ridge line.
 */
function ridge(rng: Rng, amp: number): (x: number) => number {
  const octaves = [1, 2.3, 5.1].map((k, i) => ({
    freq: k * between(rng, 0.8, 1.3),
    phase: rng() * Math.PI * 2,
    amp: amp / (i + 1) ** 1.3,
  }));
  return (x) =>
    octaves.reduce((y, o) => y + o.amp * Math.sin((x / W) * Math.PI * 2 * o.freq + o.phase), 0);
}

/**
 * Terrain: mountain ridges in layers, back to front, with a sun behind them.
 * The sky is the ground colour and the text sits in it, above the ridges.
 * Layers step from the sky colour towards the palette's family colour, so
 * the farthest range fades into the sky like atmospheric haze.
 */
const terrain: Style = (rng, p) => {
  const layers = int(rng, 4, 5);
  const sunX = between(rng, 0.15, 0.85) * W;
  let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
  body += `<circle cx="${f(sunX)}" cy="${f(VISIBLE_H * 0.74)}" r="${f(between(rng, 22, 32))}" fill="${p[2]}" fill-opacity=".85"/>`;
  for (let i = 0; i < layers; i++) {
    const base = VISIBLE_H * (0.62 + (i / layers) * 0.42);
    const height = ridge(rng, 22 - i * 3);
    let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 8) d += `L${x} ${f(base + height(x))}`;
    d += `L${W} ${H}Z`;
    body += `<path d="${d}" fill="${mix(p[0], p[1], (i + 1) / layers)}"/>`;
  }
  return { body, ground: p[0] };
};

/**
 * LifeHash-like mosaic: a random board runs Conway's Game of Life for a few
 * generations and every cell keeps a trace of how often, and how recently,
 * it was alive. That trace becomes a colour level. Only the left half is
 * simulated; the right half is its mirror, which gives the mosaic the
 * symmetric, emblem-like look of LifeHash.
 */
const lifehash: Style = (rng, p) => {
  const cell = 400 / 24;
  const half = 12;
  const rows = Math.ceil(H / cell);
  let board = Array.from({ length: rows }, () => Array.from({ length: half }, () => rng() < 0.42));
  const trace = Array.from({ length: rows }, () => new Array<number>(half).fill(0));
  const generations = 14;
  for (let g = 1; g <= generations; g++) {
    board = board.map((row, r) =>
      row.map((alive, c) => {
        let n = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if ((dr || dc) && board[(r + dr + rows) % rows][(c + dc + half) % half]) n++;
        return n === 3 || (alive && n === 2);
      }),
    );
    // Later generations weigh more, so the final state shows through the
    // accumulated history instead of being flattened by it.
    board.forEach((row, r) => row.forEach((alive, c) => alive && (trace[r][c] += g)));
  }
  const max = Math.max(1, ...trace.flat());
  const ramp = [p[0], mix(p[0], p[1], 0.6), p[1], mix(p[1], p[2], 0.5), p[2]];
  let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
  trace.forEach((row, r) =>
    row.forEach((v, c) => {
      const level = Math.min(ramp.length - 1, Math.floor((v / max) * ramp.length));
      if (level === 0) return;
      const y = f(r * cell);
      const size = f(cell + 0.5); // overlap half a unit so no hairline seams show
      body += `<rect x="${f(c * cell)}" y="${y}" width="${size}" height="${size}" fill="${ramp[level]}"/>`;
      body += `<rect x="${f(W - (c + 1) * cell)}" y="${y}" width="${size}" height="${size}" fill="${ramp[level]}"/>`;
    }),
  );
  return { defs: HALO_DEF(p[0]), body: body + HALO, ground: p[0] };
};

function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const STYLES = { mesh, rays, truchet, terrain, lifehash } as const;

export type CardArtStyle = keyof typeof STYLES;
export type CardArtTone = keyof typeof PALETTES;

/** In the order the publish modal shows them. */
export const CARD_ART_STYLES = Object.keys(STYLES) as CardArtStyle[];
export const CARD_ART_TONES = Object.keys(PALETTES) as CardArtTone[];

export const DEFAULT_CARD_ART_STYLE: CardArtStyle = "mesh";
export const DEFAULT_CARD_ART_TONE: CardArtTone = "dark";

/**
 * Style and tone are stored as plain strings (see WallMessage in the Prisma
 * schema), so anything read back from the database or a request body goes
 * through these guards. A value this file no longer knows, say a style that
 * was retired, falls back to the default instead of crashing the card.
 */
export const isCardArtStyle = (v: unknown): v is CardArtStyle =>
  typeof v === "string" && (CARD_ART_STYLES as string[]).includes(v);
export const isCardArtTone = (v: unknown): v is CardArtTone =>
  typeof v === "string" && (CARD_ART_TONES as string[]).includes(v);

/* -------------------------------------------------------------------- api */

export interface CardArt {
  /** Raw SVG markup. */
  svg: string;
  /** Ready for `background-image: url("...")`. */
  dataUri: string;
  /** Text colour for the message: white on dark grounds, near-black on light. */
  ink: string;
}

export function wallCardSeed(authorId: string, message: string): string {
  // The API trims before saving. The publish preview has to hash the same
  // string, or its art would change the moment the message is posted.
  return `${authorId}:${message.trim()}`;
}

/**
 * The visitor chooses `style` and `tone`; the seed (author id + text) chooses
 * everything else: which palette of that tone, the order of its accents and
 * every parameter of the composition. Two people picking the same style and
 * tone still get different cards, and one person gets the same card for the
 * same text every time.
 */
export function generateCardArt(seed: string, style: CardArtStyle, tone: CardArtTone): CardArt {
  const rng = mulberry32(fnv1a(seed));

  const base = pick(rng, PALETTES[tone]);
  // p[0] (ground) and p[1] (its family colour, the same hue pushed lighter
  // or darker) stay in place; the accents after them are shuffled. Styles
  // that tint the ground (rays, terrain, truchet) only ever mix p[0] with
  // p[1], because mixing the ground with an arbitrary accent is how
  // purple-to-yellow turns brown.
  const palette = [base[0], base[1], ...shuffle(rng, base.slice(2))];
  const drawn = STYLES[style](rng, palette);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice">` +
    (drawn.defs ? `<defs>${drawn.defs}</defs>` : "") +
    drawn.body +
    `</svg>`;

  return {
    svg,
    dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    ink: drawn.ink ?? inkFor(drawn.ground),
  };
}
