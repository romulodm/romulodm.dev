"use client";

import { useCallback, useId, useMemo, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";
import { gradient } from "seedicon/gradient";
import { heraldry } from "seedicon/heraldry";
import { lifehash } from "seedicon/lifehash";
import { marble } from "seedicon/marble";
import { pixelart } from "seedicon/pixelart";
import { pixels } from "seedicon/pixels";
import { randomart } from "seedicon/randomart";
import { streamlines } from "seedicon/streamlines";
import { terrain, type StyleOptions } from "seedicon/terrain";
import { truchet } from "seedicon/truchet";
import { waves } from "seedicon/waves";

import type {
    FeaturedHover,
    FeaturedLabels,
    FeaturedProjectView,
    FeaturedScreenshot,
} from "./featured";

interface FeaturedProjectCardProps {
    project: FeaturedProjectView;
    labels: FeaturedLabels;
}

/**
 * Hover motion of the main browser frame, per hover kind (featured.ts).
 *
 * The frame rests at `translate-y-5`, half a bar below the card's bottom edge,
 * and every hover state replaces that transform as a whole through an
 * arbitrary `[transform:...]`, which is why each one restates its own Y.
 * `filter` is in the transition for the kinds that dim the frame while
 * something else takes the front.
 *
 * The strings are written out in full, not assembled, so Tailwind's scanner
 * finds every class.
 */
const FRAME_MOTION: Record<FeaturedHover["kind"], string> = {
    tilt: "group-hover:[transform:perspective(1200px)_rotateX(-5deg)_translateY(0.75rem)_scale(1.04)]",
    scroll: "group-hover:[transform:translateY(0.5rem)_scale(1.02)]",
    window: "group-hover:[transform:translateY(0.5rem)_scale(1.02)]",
    phone: "origin-bottom-left group-hover:[transform:translate(-8%,1.75rem)_scale(0.92)] group-hover:brightness-[.8]",
    "second-screen":
        "origin-bottom-left group-hover:[transform:translate(-7%,1.25rem)_scale(0.9)] group-hover:brightness-[.7]",
};

/**
 * Overshooting ease for the elements that rise from the bottom edge (the phone
 * and the second window): they settle with a small bounce instead of
 * stopping dead, which reads as something being picked up rather than slid.
 */
const RISE =
    "transition-transform duration-700 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none";

/**
 * The visual half of a featured entry: the project's gradient, its tagline and
 * a browser frame rising from the bottom edge with a capture of the project's
 * hero. The whole card is one link, to the live project when there is one and
 * to the repository otherwise.
 *
 * Hover choreography, all driven by the `group` on the link. Every card lifts,
 * its gradient scales and brightens, and the arrow nudges right; on top of
 * that each project has its own move (FRAME_MOTION and featured.ts), so four
 * cards in a row never repeat one effect. Every motion is a CSS transition on
 * transform or filter, so nothing here runs JavaScript per frame, and
 * `motion-reduce:` turns the animation off (the end state still shows, it
 * just does not travel there).
 */
export default function FeaturedProjectCard({ project, labels }: FeaturedProjectCardProps) {
    const href = project.demo ?? project.source;
    const { hover } = project;
    const playSound = useHoverSound(hover.kind === "window" ? hover.sound : undefined);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${labels.open}: ${project.title}`}
            draggable={false}
            onPointerEnter={playSound}
            className="group relative block w-full lg:aspect-[16/11] overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-sm transition-transform duration-500 hover:-translate-y-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-neutral-800 dark:bg-white/[0.04]"
        >
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl">
                <div
                    aria-hidden="true"
                    style={{ background: project.gradient }}
                    className="absolute inset-0 transition-[transform,filter] duration-500 ease-in-out group-hover:scale-105 group-hover:brightness-105 group-hover:saturate-125 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />

                <div className="relative z-10 flex items-start justify-between gap-4 px-5 py-5 text-white sm:gap-8 sm:px-8 sm:py-7 xl:px-10 xl:py-8">
                    <h3 className="text-balance text-lg font-medium leading-snug sm:text-xl xl:text-2xl">
                        {project.tagline}
                    </h3>
                    <FiArrowRight
                        aria-hidden="true"
                        className="mt-1 size-6 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
                    />
                </div>

                {/* The stage: everything below the tagline. The main frame fills
                    it; the phone and the second window are placed against its
                    bottom edge and start fully below it, clipped by the card.

                    From `lg` the card has a fixed aspect and the stage fills it
                    from a fixed offset under the tagline. Below that the card
                    is full width and the tagline wraps to as many lines as the
                    phone needs, so the stage follows it in the flow with an
                    aspect of its own instead, and the frame never ends up
                    under the text. `min-h-0` makes the aspect a hard cap:
                    without it the stage grows to fit its content, and the
                    `scroll` hero is a capture two and a half viewports tall. */}
                <div className="relative z-10 aspect-[16/9] min-h-0 lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-32 lg:aspect-auto xl:top-36">
                    <div className="flex h-full justify-center">
                        <BrowserFrame
                            host={project.host}
                            className={`w-[85%] translate-y-5 rounded-t-lg border-b-0 transition-[transform,filter] duration-500 ease-out motion-reduce:transition-none ${FRAME_MOTION[hover.kind]}`}
                        >
                            <FrameContent project={project} />
                            {hover.kind === "window" && <AppWindow screen={hover.window} />}
                        </BrowserFrame>
                    </div>

                    {hover.kind === "phone" && <Phone />}

                    {hover.kind === "second-screen" && (
                        <SecondScreen host={project.host} screen={hover.screen} />
                    )}
                </div>
            </div>
        </a>
    );
}

/**
 * Window chrome shared by the main frame and the second window: three dots and
 * an address bar over the content. The caller sets size, corners and motion.
 */
function BrowserFrame({
    host,
    className,
    children,
}: {
    host: string;
    className: string;
    children: ReactNode;
}) {
    return (
        <div
            className={`flex flex-col overflow-hidden border-[3px] border-white/50 bg-neutral-950 shadow-[0_4px_20px_rgba(0,0,0,0.4),0_15px_50px_-5px_rgba(0,0,0,0.5)] ${className}`}
        >
            <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-neutral-900 px-3 py-2">
                <div aria-hidden="true" className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-white/20" />
                    <span className="size-2.5 rounded-full bg-white/20" />
                    <span className="size-2.5 rounded-full bg-white/20" />
                </div>
                <div className="min-w-0 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-center font-mono text-xs text-white/50">
                    {host}
                </div>
            </div>
            <div className="relative flex-1 overflow-hidden">{children}</div>
        </div>
    );
}

function FrameContent({ project }: { project: FeaturedProjectView }) {
    const { hero } = project;

    if (hero) {
        return (
            <Image
                src={hero.src}
                alt=""
                width={hero.width}
                height={hero.height}
                // Served as is, not through the image optimizer. The optimizer
                // re-encodes at quality 75, and on these captures (fine text,
                // film grain, dark gradients) that turned into visible blocks.
                // The files are encoded once, by hand, at about twice the
                // frame's widest size (~660px), which already is the size a
                // 2x screen needs, so there is nothing left to optimize.
                unoptimized
                className={`h-auto w-full ${
                    // `scroll`: the capture is about three times as tall as the
                    // frame shows, so panning it by half its own height walks
                    // from the hero into the section below without running out.
                    // The way down is slow enough to read as scrolling; the way
                    // back (no hover, base duration) is quicker.
                    project.hover.kind === "scroll"
                        ? "transition-transform duration-700 ease-in-out group-hover:-translate-y-1/2 group-hover:duration-[2200ms] motion-reduce:transition-none"
                        : ""
                }`}
                draggable={false}
            />
        );
    }

    if (project.iconSeed) return <AvatarWall seed={project.iconSeed} />;

    return <Placeholder project={project} />;
}

/**
 * Second window for the `second-screen` hover: another page of the project,
 * entering from below the card and settling in front of the main frame, which
 * steps back and to the left (FRAME_MOTION) to make room for it.
 */
function SecondScreen({ host, screen }: { host: string; screen: FeaturedScreenshot }) {
    return (
        <div
            aria-hidden="true"
            className={`absolute bottom-0 right-[4%] z-20 w-[62%] translate-y-[115%] rotate-3 group-hover:translate-y-[6%] group-hover:rotate-0 ${RISE}`}
        >
            <BrowserFrame host={host} className="rounded-lg">
                <Image
                    src={screen.src}
                    alt=""
                    width={screen.width}
                    height={screen.height}
                    // Served as is, like the hero (see FrameContent).
                    unoptimized
                    className="h-auto w-full"
                    draggable={false}
                />
            </BrowserFrame>
        </div>
    );
}

/**
 * App window for the `window` hover: a screenshot of the project's main
 * screen that opens on top of the hero inside the browser frame, growing from
 * 90% and fading in the way Windows 7 opened its windows (the project is a
 * Windows 7-era messenger). It is centred horizontally and sits near the top
 * of the frame, the part of the hero that is always visible.
 */
function AppWindow({ screen }: { screen: FeaturedScreenshot }) {
    return (
        <div
            aria-hidden="true"
            className="absolute left-1/2 top-[6%] z-10 w-[58%] -translate-x-1/2 scale-90 opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none"
        >
            <Image
                src={screen.src}
                alt=""
                width={screen.width}
                height={screen.height}
                // Served as is, like the hero (see FrameContent).
                unoptimized
                className="h-auto w-full"
                draggable={false}
            />
        </div>
    );
}

/**
 * Plays a short sound each time the pointer enters the card, for the `window`
 * hover (the messenger's new-message chime as its window opens).
 *
 * The <audio> element is created on the first hover rather than on mount, so
 * visitors who never point at the card never download the file.
 *
 * Browsers only let a page play sound once the visitor has clicked, tapped or
 * pressed a key on it; hovering and scrolling do not count, and a reload
 * starts the count over. A visitor who scrolls straight to this card is
 * therefore refused (`play()` rejects with NotAllowedError). In that case the
 * chime waits for the first click or key press on the page and plays then,
 * provided the pointer is still on the card. A click on the card itself
 * qualifies, so the chime still plays as the visitor opens the project. Only
 * one such retry is armed at a time, however many times the card is entered
 * before that first gesture.
 *
 * Touch screens never fire it, since the event is filtered to mouse pointers
 * and a tap would otherwise play it on the way to opening the link.
 */
function useHoverSound(src: string | undefined) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const retryArmed = useRef(false);

    return useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            if (!src || event.pointerType !== "mouse") return;

            // React clears `currentTarget` once the handler returns, so keep
            // the element for the retry below.
            const card = event.currentTarget;

            let audio = audioRef.current;
            if (!audio) {
                audio = new Audio(src);
                audio.volume = 0.6;
                audioRef.current = audio;
            }
            const sound = audio;

            const play = () => {
                // Restart instead of overlapping when the pointer leaves and
                // re-enters before the chime has finished.
                sound.currentTime = 0;
                return sound.play();
            };

            play().catch((error: unknown) => {
                const blocked = error instanceof DOMException && error.name === "NotAllowedError";
                if (!blocked || retryArmed.current) return;
                retryArmed.current = true;

                const retry = () => {
                    window.removeEventListener("pointerdown", retry, true);
                    window.removeEventListener("keydown", retry, true);
                    retryArmed.current = false;
                    if (card.matches(":hover")) play().catch(() => {});
                };
                window.addEventListener("pointerdown", retry, true);
                window.addEventListener("keydown", retry, true);
            });
        },
        [src],
    );
}

/**
 * The phone's home screen, tile by tile: a renderer and a seed for each icon,
 * in reading order (3 columns, so every three entries are one row).
 *
 * The seeds are hand-picked ones from GALLERY_SEEDS, the per-style gallery on
 * the seedicon site's home page, so each tile shows its style at its best
 * instead of whatever a derived seed happens to draw. They are fixed strings,
 * so the screen is the same on the server and the client and hydration
 * matches. The order keeps neighbouring tiles on different styles.
 *
 * Each renderer comes from its own entry point ("seedicon/<style>"), like
 * `pixels` in ProjectCard.tsx, so the bundle carries only these styles.
 * Twenty-one tiles (7 rows) fill the screen down to the bottom bezel at every
 * card width; the grid clips whatever does not fit, so a wider card shows a
 * partial last row, like a home screen mid-scroll.
 */
const PHONE_TILES: readonly { render: (options: StyleOptions) => string; seed: string }[] = [
    { render: pixelart, seed: "fb1bbdeb-c4a4-41e8-8a3c-368a55989d60" },
    { render: terrain, seed: "fb1bbdeb-c4a4-41e8-8a3c-368a55989d60" },
    { render: pixels, seed: "fb1bbdeb-c4a4-41e8-8a3c-368a55989d60" },

    { render: truchet, seed: "fb1bbdeb-c4a4-41e8-8a3c-368a55989d60" },
    { render: lifehash, seed: "ec7da957-89f4-4ff8-9f0f-a6f15b3e0a0e" },
    { render: heraldry, seed: "66d84a70-2b64-47c6-9531-80a45a4a0be2" },

    { render: randomart, seed: "ff5bbf62-bbae-42a2-97b9-644530688681" },
    { render: waves, seed: "bd26a2ed-3587-4e55-ad70-226dfbb1d48d" },
    { render: pixelart, seed: "f72da30c-93df-431e-a5a1-8a847ea77ce6" },

    { render: pixels, seed: "82987161-a8ab-421c-897b-08aec26cbdfc" },
    { render: gradient, seed: "1988f80a-5126-46b1-a5d7-745bfd40026f" },
    { render: truchet, seed: "e712c6ef-2081-4ad4-a741-4be1db7163c0" },

    { render: heraldry, seed: "e16107fc-b141-4109-b2ec-c4115441bd79" },
    { render: pixelart, seed: "1bd8afc4-93ff-44c3-b816-769240d1f0e7" },
    { render: lifehash, seed: "da1681bf-22d1-4ffb-af8b-94bcda00e208" },

    { render: waves, seed: "70c38d54-4fdd-438e-ba80-e0e5a659d3ec" },
    { render: randomart, seed: "05b6e73b-bfcd-495b-a01f-e08864677d6d" },
    { render: marble, seed: "66a2604a-2ceb-485c-9df4-fa55b70c06fb" },

    { render: streamlines, seed: "f0bed51b-2118-41bd-9961-ffb8b481c0be" },
    { render: pixels, seed: "69d40f05-fca4-43e6-be52-5ef5a193ac7c" },
    { render: terrain, seed: "da12d14d-5ef0-4694-8a3f-32f97d5bf919" },
];

const GRID_CELLS = /(<g shape-rendering="crispEdges">)((?:<rect [^>]*\/>)+)(<\/g>)/;
const GRID_CELL = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="([^"]+)"\/>/g;

/**
 * Closes the hairlines between the cells of a grid style (pixels, randomart).
 *
 * Those styles paint every cell as its own <rect>. Scaled down to the phone's
 * ~45px tiles and rotated, two neighbouring cells no longer cover their shared
 * edge between them, and the background shows through as a thin line. This
 * redraws the cells the way seedicon's own lifehash style already does: all
 * cells of one color merged into a single <path> (no edges inside it), laid
 * over a copy of itself stroked in the same color, which covers the edges
 * between different colors. Markup that does not match the expected shape
 * comes back untouched, so a change in the package degrades to the old
 * hairlines rather than to missing cells.
 */
function sealGridCells(svg: string): string {
    return svg.replace(GRID_CELLS, (group: string, open: string, cells: string, close: string) => {
        const paths = new Map<string, string>();
        let count = 0;
        for (const [, x, y, width, height, fill] of cells.matchAll(GRID_CELL)) {
            paths.set(fill, `${paths.get(fill) ?? ""}M${x} ${y}h${width}v${height}h-${width}Z`);
            count += 1;
        }
        if (count !== cells.split("<rect").length - 1) return group;

        let under = "";
        let over = "";
        for (const [fill, d] of paths) {
            under += `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="0.64"/>`;
            over += `<path d="${d}" fill="${fill}"/>`;
        }
        return open + under + over + close;
    });
}

/**
 * Makes the <defs> ids of one tile unique on the page. gradient and marble
 * name their gradient and filter after the seed, which is unique among the
 * tiles, but the card is rendered twice (FeaturedProjects on desktop,
 * FeaturedProjectsList below `lg`, one of them hidden). With the same id in
 * both copies, `url(#id)` resolves to the first one in the document, inside
 * the hidden copy, and the visible tile paints nothing.
 */
function scopeIds(svg: string, scope: string): string {
    return svg.replace(/(id="|url\(#)(seedicon-[\w-]+)/g, `$1$2-${scope}`);
}

/**
 * Phone for the `phone` hover: a home screen of app icons, each one a seedicon
 * avatar (PHONE_TILES). It rests below the card and rises in on hover, tilting
 * the other way as it lands, while the browser frame steps back (FRAME_MOTION).
 *
 * `shape: "square"` keeps the markup free of <clipPath> ids; the rounded icon
 * corners come from the tile's own `rounded-[28%]` and `overflow-hidden`.
 * useId is stable between the server and the client, so the scoped ids match
 * on hydration.
 */
function Phone() {
    const scope = useId().replace(/[^\w-]/g, "");
    const tiles = useMemo(
        () =>
            PHONE_TILES.map(({ render, seed }, index) => ({
                key: `${index}:${seed}`,
                svg: scopeIds(sealGridCells(render({ seed, size: 64, shape: "square" })), `${scope}-${index}`),
            })),
        [scope],
    );

    return (
        <div
            aria-hidden="true"
            className={`absolute bottom-0 right-[8%] z-20 w-[24%] translate-y-[110%] rotate-[10deg] group-hover:translate-y-[14%] group-hover:-rotate-3 ${RISE}`}
        >
            <div className="aspect-[9/19] rounded-[1.75rem] border-[3px] border-white/50 bg-neutral-950 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4),0_15px_50px_-5px_rgba(0,0,0,0.5)]">
                <div className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-neutral-900">
                    <div className="relative flex items-center justify-between px-4 pb-1 pt-2 font-mono text-[9px] font-semibold text-white/70">
                        <span>9:41</span>
                        <span className="absolute left-1/2 top-1.5 h-3.5 w-12 -translate-x-1/2 rounded-full bg-black" />
                        <span className="flex items-center gap-0.5">
                            <span className="h-1.5 w-3 rounded-[2px] border border-white/60" />
                        </span>
                    </div>

                    <div className="px-3 pb-3 pt-3 font-mono text-[11px] font-semibold tracking-tight text-white/85">
                        seedicon
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-2.5 overflow-hidden px-3">
                        {tiles.map((tile) => (
                            <span
                                key={tile.key}
                                className="block aspect-square overflow-hidden rounded-[28%] [&>svg]:h-full [&>svg]:w-full"
                                dangerouslySetInnerHTML={{ __html: tile.svg }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Placeholder for the seedicon card while it has no screenshot: the package's
 * own output, which says more about it than a picture of its landing page.
 * The first tile is the project's fixed icon seed (the same drawing as its
 * simple card); the rest derive from it, so the wall is identical on the
 * server and the client and hydration matches. `shape: "square"` keeps the
 * markup free of the <clipPath> ids the rounded shapes need, which would
 * collide with one another on the page.
 */
const AVATAR_COLUMNS = 8;
const AVATAR_ROWS = 4;

function AvatarWall({ seed }: { seed: string }) {
    const tiles = Array.from({ length: AVATAR_COLUMNS * AVATAR_ROWS }, (_, i) =>
        i === 0 ? seed : `${seed}:${i}`,
    );

    return (
        <div
            aria-hidden="true"
            className="grid h-full content-start gap-2 p-4"
            style={{ gridTemplateColumns: `repeat(${AVATAR_COLUMNS}, minmax(0, 1fr))` }}
        >
            {tiles.map((tileSeed) => (
                <span
                    key={tileSeed}
                    className="block aspect-square overflow-hidden rounded-md [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{
                        __html: pixels({ seed: tileSeed, size: 64, shape: "square" }),
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Generic placeholder for a featured project without a hero capture: the name
 * on a faint dot grid, tinted with the project's accent. Deliberately plain,
 * so it reads as "image goes here" rather than pretending to be the product.
 */
function Placeholder({ project }: { project: FeaturedProjectView }) {
    return (
        <div
            aria-hidden="true"
            className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:16px_16px] px-6 pb-8"
        >
            <span
                className="font-mono text-3xl font-semibold tracking-tight xl:text-4xl"
                style={{ color: `rgb(${project.accent})` }}
            >
                {project.title}
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-white/40">
                {project.stack
                    .slice(0, 3)
                    .map((item) => item.label)
                    .join(" · ")}
            </span>
        </div>
    );
}
