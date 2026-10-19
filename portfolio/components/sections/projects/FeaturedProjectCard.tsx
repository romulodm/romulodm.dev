"use client";

import { useCallback, useMemo, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";
import { heraldry } from "seedicon/heraldry";
import { identicon } from "seedicon/identicon";
import { pixels } from "seedicon/pixels";
import { streamlines } from "seedicon/streamlines";
import { terrain } from "seedicon/terrain";
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
            className="group relative block aspect-[16/11] w-full overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-sm transition-transform duration-500 hover:-translate-y-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-neutral-800 dark:bg-white/[0.04]"
        >
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl">
                <div
                    aria-hidden="true"
                    style={{ background: project.gradient }}
                    className="absolute inset-0 transition-[transform,filter] duration-500 ease-in-out group-hover:scale-105 group-hover:brightness-105 group-hover:saturate-125 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />

                <div className="relative z-10 flex items-start justify-between gap-8 px-8 py-7 text-white xl:px-10 xl:py-8">
                    <h3 className="text-balance text-xl font-medium leading-snug xl:text-2xl">
                        {project.tagline}
                    </h3>
                    <FiArrowRight
                        aria-hidden="true"
                        className="mt-1 size-6 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
                    />
                </div>

                {/* The stage: everything below the tagline. The main frame fills
                    it; the phone and the second window are placed against its
                    bottom edge and start fully below it, clipped by the card. */}
                <div className="absolute inset-x-0 bottom-0 top-32 z-10 xl:top-36">
                    <div className="flex h-full justify-center">
                        <BrowserFrame
                            host={project.host}
                            className={`w-[85%] translate-y-5 rounded-t-lg border-b-0 transition-[transform,filter] duration-500 ease-out motion-reduce:transition-none ${FRAME_MOTION[hover.kind]}`}
                        >
                            <FrameContent project={project} />
                            {hover.kind === "window" && <AppWindow screen={hover.window} />}
                        </BrowserFrame>
                    </div>

                    {hover.kind === "phone" && project.iconSeed && <Phone seed={project.iconSeed} />}

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
 * The renderers on the phone's home screen, cycled tile by tile. Each one is
 * imported from its own entry point ("seedicon/<style>"), like `pixels` in
 * ProjectCard.tsx, so the bundle carries these six styles and not all
 * seventeen. All six draw without <defs> ids (unlike gradient, marble and
 * kaleidoscope), so a screenful of them can share the document with no
 * clashing clipPath or filter ids. They are also among the lightest in
 * markup (about 0.3 to 1.5 KB per icon, streamlines aside), which matters
 * because every tile is inlined SVG in the server-rendered HTML.
 */
const PHONE_STYLES = [terrain, truchet, waves, heraldry, identicon, streamlines];

/**
 * Enough icons to fill the screen down to the bottom bezel at every card
 * width (3 columns by 7 rows). The grid clips whatever does not fit, so a
 * wider card shows a partial last row, like a home screen mid-scroll, rather
 * than an empty strip under the icons.
 */
const PHONE_TILES = 21;

/**
 * Phone for the `phone` hover: a home screen of app icons, each one a seedicon
 * avatar. It rests below the card and rises in on hover, tilting the other way
 * as it lands, while the browser frame steps back (FRAME_MOTION).
 *
 * The seeds derive from the project's fixed icon seed, so the screen is the
 * same on the server and the client and hydration matches. `shape: "square"`
 * keeps the markup free of <clipPath> ids; the rounded icon corners come from
 * the tile's own `rounded-[28%]` and `overflow-hidden`.
 */
function Phone({ seed }: { seed: string }) {
    const tiles = useMemo(
        () =>
            Array.from({ length: PHONE_TILES }, (_, index) => {
                const render = PHONE_STYLES[index % PHONE_STYLES.length];
                const tileSeed = `${seed}:phone:${index}`;
                return { key: tileSeed, svg: render({ seed: tileSeed, size: 64, shape: "square" }) };
            }),
        [seed],
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
