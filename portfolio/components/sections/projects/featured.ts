/**
 * Projects that get a case-study entry in the detailed view of the projects
 * section (FeaturedProjects.tsx). The simple grid lists every pinned repo from
 * data.ts; this list is the subset worth a closer look, in the order shown.
 *
 * Only what GitHub cannot supply lives here. Title, stars, creation date, the
 * repo URL and the live URL (the repo's "homepage" field) come from the same
 * fetch the simple grid already makes, so a project missing from that fetch is
 * skipped instead of rendering half a card. The copy (tagline and bullets)
 * lives under `home.projects.featured.<messagesKey>` in messages/*.json; the
 * description paragraph reuses the simple card's `home.projects.items` entry,
 * so the two views never describe the same project in two different ways.
 */

import type { TechLogo, TechLogoName } from "@/lib/tech-logos";

/**
 * One chip in a project's stack. `logo` names an entry of lib/tech-logos.ts
 * and doubles as the chip's label, so the chip shows the same logo, colour and
 * URL as the Stack section on the home page. Tools without a logo there (or
 * anywhere) take a plain `label` instead and render as text only.
 */
export type StackItem = { logo: TechLogoName } | { label: string };

/**
 * A screenshot drawn inside one of the card's device frames. The images are
 * decorative: the whole card is a single link with its own aria-label, so they
 * render with an empty alt and carry no text of their own.
 */
export interface FeaturedScreenshot {
    /** Path under /public, e.g. "/images/projects/seedicon/hero.webp". */
    src: string;
    width: number;
    height: number;
}

/**
 * What the card does on hover, on top of the lift and the gradient bloom every
 * card shares. Each featured project gets its own so that scrolling down the
 * section does not repeat one effect four times:
 *
 * - `tilt`: the browser frame leans toward the reader.
 * - `scroll`: the screenshot pans down, showing what sits below the hero. The
 *   hero image must be a tall capture (see scripts/capture-project-screens.mjs)
 *   or the pan runs out of picture.
 * - `phone`: the browser frame steps back and a phone rises from the bottom
 *   edge, its screen filled with avatars drawn by the project's own package
 *   (seedicon; the tiles are listed in FeaturedProjectCard.tsx).
 * - `second-screen`: the browser frame steps back and a second window with
 *   another page of the project slides in front of it.
 * - `window`: an app window opens on top of the hero, inside the same browser
 *   frame, optionally with a sound (a path under /public) played as it opens.
 */
export type FeaturedHover =
    | { kind: "tilt" }
    | { kind: "scroll" }
    | { kind: "phone" }
    | { kind: "second-screen"; screen: FeaturedScreenshot }
    | { kind: "window"; window: FeaturedScreenshot; sound?: string };

export interface FeaturedProjectConfig {
    /** Repository name, matched against the GitHub data from data.ts. */
    repo: string;
    /**
     * Title shown in the panel when the repository name is not the project's
     * name (a domain, a slug). Defaults to the repository name.
     */
    name?: string;
    /** Key under `home.projects.featured` in messages/*.json. */
    messagesKey: string;
    stack: StackItem[];
    /**
     * Post about the project. A path starting with "/" goes through the
     * locale-aware Link (so "/blog/seedicon" becomes "/pt/blog/seedicon");
     * anything else is treated as an external URL and opens in a new tab.
     * Omitted while the post does not exist: the button is simply not drawn.
     */
    blogHref?: string;
    /**
     * Card background, built by `cardGradient`: solid shades of the project's
     * hue across the card, with the pale tone confined to the bottom-right
     * corner. The tagline and arrow are white, so the top edge (both corners)
     * has to stay dark enough for white text.
     */
    gradient: string;
    /**
     * Accent used by the panel (rule, bullet marks, buttons). An "r g b"
     * triplet so it can take an alpha channel: `rgb(var(--project-accent) / .9)`.
     * The "visit" button is filled with it and labelled in white, so it has to
     * clear 4.5:1 against white: the 700 shade of the hue, or violet-600.
     */
    accent: string;
    /**
     * Capture of the project's live hero, drawn in the browser frame. The files
     * are produced by `npm --prefix portfolio run projects:screens`; without
     * one the frame shows a placeholder built from the project itself, so a
     * project can be featured before it has images.
     */
    hero?: FeaturedScreenshot;
    hover: FeaturedHover;
}

/**
 * Card background from three "r g b" shades of one hue (700, 600, 500) and a
 * pale tone. The linear layer runs dark to light along 145deg, so the tagline
 * (top-left) sits on the 700 shade and the arrow (top-right, about halfway
 * along on a 16:11 card) near the 600; white keeps at least 3:1 on both, the
 * bar for large text and icons. The pale tone is a radial layer that fades out
 * within the bottom-right corner, behind the edge of the device frames.
 */
function cardGradient(dark: string, mid: string, light: string, pale: string): string {
    return (
        `radial-gradient(circle at 100% 100%, rgb(${pale}) 0%, rgb(${pale} / 0) 45%), ` +
        `linear-gradient(145deg, rgb(${dark}) 0%, rgb(${mid}) 55%, rgb(${light}) 100%)`
    );
}

export const FEATURED_PROJECTS: FeaturedProjectConfig[] = [
    {
        repo: "romulodm.dev",
        messagesKey: "romulodm",
        stack: [
            { logo: "Next.js" },
            { logo: "React" },
            { logo: "TypeScript" },
            { logo: "Tailwind CSS" },
            { logo: "Go" },
            { logo: "PostgreSQL" },
            { logo: "Prisma" },
            { logo: "Redis" },
            { label: "BullMQ" },
            { logo: "MinIO" },
            { logo: "Docker" },
            { logo: "Nginx" },
        ],
        // violet-700 / violet-600 / violet-500, corner violet-200.
        gradient: cardGradient("109 40 217", "124 58 237", "139 92 246", "221 214 254"),
        // violet-600, the site's own projects colour (--projects-color in
        // dark mode): white text on it passes AA, which violet-500 does not.
        accent: "124 58 237",
        // Tall capture (two viewports and a half): the `scroll` hover pans
        // through it from the hero down into the next section.
        hero: { src: "/images/projects/romulodm.dev/hero.webp", width: 1440, height: 2156 },
        hover: { kind: "scroll" },
    },
    {
        repo: "seedicon",
        messagesKey: "seedicon",
        stack: [
            { logo: "TypeScript" },
            { logo: "React" },
            { label: "tsup" },
            { logo: "Vitest" },
            { logo: "GitHub Actions" },
            { logo: "npm" },
            { logo: "Next.js" },
            { logo: "Vercel" },
        ],
        // amber-700 / amber-600 / amber-500, corner amber-100.
        gradient: cardGradient("180 83 9", "217 119 6", "245 158 11", "254 243 199"),
        accent: "180 83 9",
        hero: { src: "/images/projects/seedicon/hero.webp", width: 1440, height: 713 },
        hover: { kind: "phone" },
    },
    {
        repo: "modernlivemessenger.com.br",
        name: "Modern Live Messenger",
        messagesKey: "modernLiveMessenger",
        stack: [
            { logo: "React" },
            { logo: "JavaScript" },
            { label: "7.css" },
            { logo: "OpenAI API" },
        ],
        // sky-700 / sky-600 / sky-500, corner green-200.
        gradient: cardGradient("3 105 161", "2 132 199", "14 165 233", "187 247 208"),
        accent: "3 105 161",
        // The Windows 7 desktop the site opens on; hovering opens the chat
        // window on it with MSN's new-message chime.
        hero: { src: "/images/projects/modernlivemessenger.com.br/hero.webp", width: 1440, height: 810 },
        hover: {
            kind: "window",
            window: { src: "/images/projects/modernlivemessenger.com.br/chat.webp", width: 1148, height: 829 },
            sound: "/sounds/msn-type.mp3",
        },
    },
    {
        repo: "go-chess",
        messagesKey: "goChess",
        stack: [
            { logo: "Go" },
            { label: "Gorilla WebSocket" },
            { logo: "React" },
            { logo: "JavaScript" },
        ],
        // Raspberry: pink-800 / pink-700 / pink-600, corner pink-100. One step
        // darker than the other cards, for a deeper magenta.
        gradient: cardGradient("157 23 77", "190 24 93", "219 39 119", "252 231 243"),
        accent: "190 24 93",
        hero: { src: "/images/projects/go-chess/hero.webp", width: 1440, height: 750 },
        hover: {
            kind: "second-screen",
            // A match in progress: the board and the in-game chat.
            screen: { src: "/images/projects/go-chess/board.webp", width: 1016, height: 620 },
        },
    },
];

/**
 * Everything a featured entry needs on the client, already resolved on the
 * server: strings translated, GitHub fields merged in. Plain data only, so it
 * crosses the server/client boundary as props.
 */
export interface FeaturedProjectView {
    id: string;
    title: string;
    tagline: string;
    description: string;
    bullets: string[];
    /** Year the repository was created, from GitHub. */
    year: string | null;
    stars: number;
    forks: number;
    /** npm downloads in the last week, for projects that are published packages. */
    weeklyDownloads: number | null;
    demo: string | null;
    source: string;
    /** Shown in the address bar of the card's browser frames. */
    host: string;
    blogHref: string | null;
    stack: FeaturedStackItem[];
    gradient: string;
    accent: string;
    hero: FeaturedScreenshot | null;
    hover: FeaturedHover;
    iconSeed: string | null;
}

/** A StackItem resolved on the server: the logo object itself, not its name. */
export interface FeaturedStackItem {
    label: string;
    logo: TechLogo | null;
}

export interface FeaturedLabels {
    visit: string;
    code: string;
    blog: string;
    stars: string;
    forks: string;
    downloads: string;
    /** Suffix after the download count, e.g. "/semana". */
    perWeek: string;
    open: string;
    /** Toggle of the collapsed details in the list below `lg`. */
    more: string;
    less: string;
}
