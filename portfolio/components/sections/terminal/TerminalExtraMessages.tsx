"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import PixelWordmark from "@/components/PixelWordmark";
import { PAPERS } from "@/data/papers";
import { Link } from "@/i18n/navigation";

import { findEntry } from "./catalog";
import {
    Cmd,
    Muted,
    Output,
    Prompt,
    Spinner,
    formatSeconds,
    useFakeLoadTime,
    useIntlLocale,
    useTimedLoad,
} from "./TerminalPrimitives";

/*
 * Commands added after the first batch: the ones backed by live data (git log,
 * blog, visitors) and the toys (top, npm install, sl, cowsay, seedicon,
 * wordmark, man).
 */

const LINK_CLASS = "text-purple-400 underline";

/* ------------------------------------------------------------------ data -- */

interface PresenceCommit {
    sha: string;
    message: string;
    url: string;
    repository: string;
    date: string;
}

interface PresenceSnapshot {
    commits: { recent?: PresenceCommit[] } | null;
    visitors: number | null;
}

/** Same public endpoint the "Agora" strip reads; it is cached server-side. */
async function fetchPresence(): Promise<PresenceSnapshot> {
    const response = await fetch("/api/presence");
    if (!response.ok) throw new Error(`presence responded with ${response.status}`);
    return (await response.json()) as PresenceSnapshot;
}

interface PublicPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    readingTime: number | null;
    publishedAt: string | null;
}

async function fetchLatestPosts(locale: string, limit: number): Promise<PublicPost[]> {
    const params = new URLSearchParams({ sort: "newest", limit: String(limit), locale });
    const response = await fetch(`/api/posts/public?${params}`);
    if (!response.ok) throw new Error(`posts responded with ${response.status}`);
    const payload = (await response.json()) as { items: PublicPost[] };
    return payload.items;
}

/* -------------------------------------------------------------- git log -- */

export function GitLogMessage({ command, oneline }: { command: string; oneline: boolean }): JSX.Element {
    const t = useTranslations("terminal");
    const format = useFormatter();
    const state = useTimedLoad(fetchPresence);

    if (state.status === "loading") {
        return (
            <div className="font-mono text-sm">
                <Prompt command={command} />
                <Muted><Spinner /></Muted>
            </div>
        );
    }

    if (state.status === "error") {
        return (
            <div className="font-mono text-sm">
                <Prompt command={command} />
                <div className="text-red-500">{t("git-log.error")}</div>
            </div>
        );
    }

    const commits = state.data.commits?.recent ?? [];
    const shown = oneline ? commits : commits.slice(0, 5);

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.git-log", { ms: state.ms })}</Muted>

            {shown.length === 0 ? (
                <Output>{t("git-log.empty")}</Output>
            ) : oneline ? (
                <Output>
                    {shown.map((commit) => (
                        <div key={commit.sha} className="truncate">
                            <a href={commit.url} target="_blank" rel="noreferrer" className="text-yellow-600 dark:text-yellow-400 hover:underline">
                                {commit.sha.slice(0, 7)}
                            </a>{" "}
                            {commit.message}{" "}
                            <span className="text-gray-500 dark:text-neutral-500">({commit.repository})</span>
                        </div>
                    ))}
                </Output>
            ) : (
                <Output>
                    {shown.map((commit) => (
                        <div key={commit.sha} className="mb-3">
                            <a href={commit.url} target="_blank" rel="noreferrer" className="text-yellow-600 dark:text-yellow-400 hover:underline">
                                commit {commit.sha}
                            </a>
                            <div>Author: Romulo de Moraes</div>
                            <div>Date:   {format.dateTime(new Date(commit.date), { dateStyle: "medium", timeStyle: "short" })}</div>
                            <div className="text-gray-500 dark:text-neutral-500">Repo:   {commit.repository}</div>
                            <div className="pl-4 pt-1">{commit.message}</div>
                        </div>
                    ))}
                </Output>
            )}
        </div>
    );
}

/* ----------------------------------------------------------------- blog -- */

export function BlogMessage({ command, latestOnly }: { command: string; latestOnly: boolean }): JSX.Element {
    const t = useTranslations("terminal");
    const locale = useLocale();
    const format = useFormatter();
    const state = useTimedLoad(() => fetchLatestPosts(locale, latestOnly ? 1 : 5));

    let body: JSX.Element;

    if (state.status === "loading") {
        body = <Muted><Spinner /></Muted>;
    } else if (state.status === "error") {
        body = <div className="text-red-500">{t("blog.error")}</div>;
    } else if (state.data.length === 0) {
        body = (
            <>
                <Muted>{t("loadings.blog", { ms: state.ms })}</Muted>
                <Output>{t("blog.empty")}</Output>
            </>
        );
    } else {
        body = (
            <>
                <Muted>{t("loadings.blog", { ms: state.ms })}</Muted>
                <Output>
                    {state.data.map((post) => (
                        <div key={post.id} className="mb-2 max-w-[36rem]">
                            <Link href={`/blog/${post.slug}`} className={LINK_CLASS}>
                                {post.title}
                            </Link>
                            <Muted>
                                {[
                                    post.publishedAt ? format.dateTime(new Date(post.publishedAt), { dateStyle: "medium" }) : null,
                                    post.readingTime ? t("blog.reading", { minutes: post.readingTime }) : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </Muted>
                            {latestOnly && post.excerpt ? <p className="mt-1">{post.excerpt}</p> : null}
                        </div>
                    ))}
                    <Muted>
                        {t("blog.all")}{" "}
                        <Link href="/blog" className={LINK_CLASS}>/blog</Link>
                    </Muted>
                </Output>
            </>
        );
    }

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            {body}
        </div>
    );
}

/* ------------------------------------------------------------- visitors -- */

export function VisitorsMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const state = useTimedLoad(fetchPresence);

    let body: JSX.Element;

    if (state.status === "loading") {
        body = <Muted><Spinner /></Muted>;
    } else if (state.status === "error" || state.data.visitors === null) {
        body = <Output>{t("visitors.error")}</Output>;
    } else {
        // Whoever runs the command is on the site, so the floor is one, same
        // as the "Agora" strip (GA4 realtime lags a few seconds behind).
        const count = Math.max(1, state.data.visitors);
        body = (
            <>
                <Muted>{t("loadings.visitors", { ms: state.ms })}</Muted>
                <Output>{t("visitors.count", { count })}</Output>
            </>
        );
    }

    return (
        <div className="font-mono text-sm">
            <Prompt command="visitors" />
            {body}
        </div>
    );
}

/* --------------------------------------------------------------- papers -- */

export function PapersMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const locale = useLocale() === "pt" ? "pt" : "en";
    const ms = useFakeLoadTime(300, 900);

    return (
        <div className="font-mono text-sm">
            <Prompt command="papers" />
            <Muted>{t("loadings.papers", { ms })}</Muted>

            <Output>
                {PAPERS.map((paper, index) => (
                    <div key={paper.title} className="mb-3 max-w-[36rem]">
                        <div>
                            <span className="text-gray-500 dark:text-neutral-500">[{index + 1}]</span>{" "}
                            <a href={paper.url} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                                {paper.title}
                            </a>
                        </div>
                        <Muted className="pl-4">{paper.authors}</Muted>
                        <Muted className="pl-4">
                            {paper.venue[locale]} · {paper.year}
                        </Muted>
                        {paper.award ? (
                            <div className="pl-4 text-yellow-600 dark:text-yellow-400">
                                {t("papers.award", { award: paper.award[locale] })}
                            </div>
                        ) : null}
                    </div>
                ))}
                <Muted className="max-w-[36rem]">{t("papers.note")}</Muted>
            </Output>
        </div>
    );
}

/* ------------------------------------------------------------------ top -- */

interface ProcessRow {
    pid: number;
    name: string;
    cpu: number;
    mem: number;
    seconds: number;
}

/**
 * Base CPU share per process, in the order of `top.processes`. The last one is
 * sleep, kept near zero on purpose.
 */
const BASE_CPU = [43, 38, 27, 19, 9, 6, 4, 0.3];

function jitter(base: number): number {
    if (base < 1) return Math.round(Math.random() * 5) / 10;
    return Math.max(0.1, Math.round((base + (Math.random() - 0.5) * base * 0.4) * 10) / 10);
}

function formatCpuTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = (seconds % 60).toFixed(2).padStart(5, "0");
    return `${minutes}:${rest}`;
}

export function TopMessage({ colorful }: { colorful: boolean }): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(20, 120);
    const names = t.raw("top.processes") as string[];

    const [rows, setRows] = useState<ProcessRow[]>(() =>
        names.map((name, index) => ({
            pid: 1909 + index * 37,
            name,
            cpu: jitter(BASE_CPU[index] ?? 1),
            mem: Math.round(Math.random() * 120) / 10,
            seconds: Math.random() * 600,
        })),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setRows((prev) =>
                prev
                    .map((row, index) => ({
                        ...row,
                        cpu: jitter(BASE_CPU[index] ?? 1),
                        seconds: row.seconds + (row.cpu / 100) * 1.5,
                    }))
                    .sort((a, b) => b.cpu - a.cpu),
            );
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const running = rows.filter((row) => row.cpu >= 1).length;

    return (
        <div className="font-mono text-sm">
            <Prompt command={colorful ? "htop" : "top"} />
            <Muted>{t("loadings.top", { ms })}</Muted>

            <Output>
                <div>{t("top.tasks", { total: rows.length, running })}</div>

                {colorful ? (
                    <div className="my-2 max-w-[28rem]">
                        {rows.slice(0, 4).map((row, index) => (
                            <div key={row.pid} className="flex items-center gap-2">
                                <span className="w-4 text-sky-500">{index}</span>
                                <span className="text-gray-500">[</span>
                                <span className="flex-1 overflow-hidden whitespace-nowrap text-green-500">
                                    {"|".repeat(Math.round(Math.min(100, row.cpu) / 4))}
                                </span>
                                <span className="w-14 text-right">{row.cpu.toFixed(1)}%</span>
                                <span className="text-gray-500">]</span>
                            </div>
                        ))}
                    </div>
                ) : null}

                <table className="mt-2 border-separate border-spacing-x-3 -ml-3">
                    <thead>
                        <tr className={colorful ? "bg-green-600 text-black" : "font-semibold"}>
                            <th className="text-right font-semibold">PID</th>
                            <th className="text-left font-semibold">USER</th>
                            <th className="text-right font-semibold">%CPU</th>
                            <th className="text-right font-semibold">%MEM</th>
                            <th className="text-right font-semibold">TIME+</th>
                            <th className="text-left font-semibold">COMMAND</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.pid}>
                                <td className="text-right">{row.pid}</td>
                                <td>romulo</td>
                                <td className={`text-right ${colorful && row.cpu > 30 ? "text-red-500" : ""}`}>{row.cpu.toFixed(1)}</td>
                                <td className="text-right">{row.mem.toFixed(1)}</td>
                                <td className="text-right">{formatCpuTime(row.seconds)}</td>
                                <td className={colorful ? "text-sky-500" : ""}>{row.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Output>
        </div>
    );
}

/* ---------------------------------------------------------- npm install -- */

const FAKE_PACKAGES = [
    "left-pad", "is-odd", "is-even", "is-number", "is-true", "is-false", "coffee-loader",
    "works-on-my-machine", "stackoverflow-copy-paste", "deadline-extender", "tabs-vs-spaces",
    "semicolon-police", "undefined-is-not-a-function", "rm-rf-safety-net", "404-not-found",
    "yet-another-date-lib", "moment-of-regret", "promise-to-finish-later", "callback-hell",
    "hello-world-enterprise", "node-modules-black-hole", "todo-later", "fix-final-v2",
    "sleep-deprivation", "imposter-syndrome", "caffeine-polyfill", "friday-deploy",
    "legacy-code-do-not-touch", "chatgpt-said-so", "one-more-dependency",
];

const NPM_PACKAGE_COUNT = 1337;

export function NpmInstallMessage({ command }: { command: string }): JSX.Element {
    const t = useTranslations("terminal");
    const intlLocale = useIntlLocale();
    const ms = useFakeLoadTime(300, 900);
    const [lines, setLines] = useState<string[]>([]);
    const [elapsedMs, setElapsedMs] = useState<number | null>(null);

    useEffect(() => {
        const startedAt = performance.now();
        let emitted = 0;
        const total = 45;

        const interval = setInterval(() => {
            emitted += 1;
            const name = FAKE_PACKAGES[Math.floor(Math.random() * FAKE_PACKAGES.length)];
            const version = `${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 30)}`;
            const line = `npm http fetch GET 200 https://registry.npmjs.org/${name}/-/${name}-${version}.tgz ${Math.floor(20 + Math.random() * 400)}ms`;
            // Only the tail is kept, so the output scrolls in place instead of
            // pushing the prompt forty lines down.
            setLines((prev) => [...prev.slice(-7), line]);

            if (emitted >= total) {
                clearInterval(interval);
                setElapsedMs(performance.now() - startedAt);
            }
        }, 70);

        return () => clearInterval(interval);
    }, []);

    const count = new Intl.NumberFormat(intlLocale).format(NPM_PACKAGE_COUNT);

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.npm-install", { ms })}</Muted>

            <Output>
                {elapsedMs === null ? (
                    <>
                        {lines.map((line, index) => (
                            <div key={index} className="truncate text-gray-500 dark:text-neutral-500">{line}</div>
                        ))}
                        <div><Spinner /></div>
                    </>
                ) : (
                    <>
                        <div>{t("npm-install.done", { count, seconds: formatSeconds(elapsedMs, intlLocale) })}</div>
                        <Muted>{t("npm-install.funding", { count: 404 })}</Muted>
                    </>
                )}
            </Output>
        </div>
    );
}

/* ------------------------------------------------------------------- sl -- */

const TRAIN = String.raw`
      o O o
     o
    __n_____   ____________   ____________
   |  |  |  |_|  romulo  |_|   .dev    |
  [|__|__|__|_|__________|_|___________|
 _/o-(_)-(_)-o  (_)  (_)    (_)  (_)
`;

export function SlMessage(): JSX.Element {
    const t = useTranslations("terminal");
    const intlLocale = useIntlLocale();
    const ms = useFakeLoadTime(50, 400);
    const trackRef = useRef<HTMLDivElement>(null);
    const trainRef = useRef<HTMLPreElement>(null);
    const [elapsedMs, setElapsedMs] = useState<number | null>(null);

    useEffect(() => {
        const track = trackRef.current;
        const train = trainRef.current;
        if (!track || !train) return;

        const startedAt = performance.now();
        const distance = track.clientWidth + train.offsetWidth;
        // Constant speed regardless of terminal width: ~220px per second.
        const duration = Math.max(2500, (distance / 220) * 1000);

        const animation = train.animate(
            [{ transform: "translateX(0)" }, { transform: `translateX(-${distance}px)` }],
            { duration, easing: "linear", fill: "forwards" },
        );
        animation.onfinish = () => setElapsedMs(performance.now() - startedAt);

        return () => animation.cancel();
    }, []);

    return (
        <div className="font-mono text-sm">
            <Prompt command="sl" />
            <Muted>{t("loadings.sl", { ms })}</Muted>

            <div ref={trackRef} className="relative h-28 w-full overflow-hidden">
                <pre ref={trainRef} className="absolute left-full top-0 text-gray-700 dark:text-neutral-300">
                    {TRAIN}
                </pre>
            </div>
            {elapsedMs !== null ? (
                <Muted>{t("sl.passed", { seconds: formatSeconds(elapsedMs, intlLocale) })}</Muted>
            ) : null}
        </div>
    );
}

/* --------------------------------------------------------------- cowsay -- */

const COW = String.raw`
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||`;

const BUBBLE_WIDTH = 40;

function wrap(text: string, width: number): string[] {
    const lines: string[] = [];
    let current = "";

    for (const word of text.split(/\s+/).filter(Boolean)) {
        // Words longer than the bubble are cut, like cowsay does.
        for (let rest = word; rest.length > 0; rest = rest.slice(width)) {
            const piece = rest.slice(0, width);
            if (!current) current = piece;
            else if (current.length + 1 + piece.length <= width) current += ` ${piece}`;
            else {
                lines.push(current);
                current = piece;
            }
        }
    }

    if (current) lines.push(current);
    return lines.length ? lines : [""];
}

function bubble(text: string): string {
    const lines = wrap(text, BUBBLE_WIDTH);
    const width = Math.max(...lines.map((line) => line.length));
    const top = ` ${"_".repeat(width + 2)}`;
    const bottom = ` ${"-".repeat(width + 2)}`;

    if (lines.length === 1) {
        return [top, `< ${lines[0]} >`, bottom].join("\n");
    }

    const body = lines.map((line, index) => {
        const [open, close] = index === 0 ? ["/", "\\"] : index === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
        return `${open} ${line.padEnd(width)} ${close}`;
    });

    return [top, ...body, bottom].join("\n");
}

export function CowsayMessage({ command, text }: { command: string; text: string }): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(5, 80);
    const said = text.trim() || t("cowsay.default");

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.cowsay", { ms })}</Muted>
            <pre className="mt-2 text-gray-700 dark:text-neutral-300">{bubble(said) + COW}</pre>
        </div>
    );
}

/* ------------------------------------------------------------- seedicon -- */

const SEEDICON_DEMO_STYLES = ["pixels", "identicon", "marble", "gradient"] as const;

interface GeneratedAvatars {
    images: { style: string; uri: string }[];
}

export function SeediconMessage({ command, text }: { command: string; text: string }): JSX.Element {
    const t = useTranslations("terminal");
    const seed = text.trim();

    // The package is imported on demand: it would otherwise ship every avatar
    // style in the home page bundle for a command most visitors never type.
    const state = useTimedLoad<GeneratedAvatars>(async () => {
        if (!seed) return { images: [] };
        const { generateAvatarDataUri } = await import("seedicon");
        return {
            images: SEEDICON_DEMO_STYLES.map((style) => ({
                style,
                uri: generateAvatarDataUri({ seed, style, size: 72, shape: "rounded" }),
            })),
        };
    });

    let body: JSX.Element;

    if (!seed) {
        body = <Output>{t.rich("seedicon.usage", { cmd: (chunks) => <Cmd>{chunks}</Cmd> })}</Output>;
    } else if (state.status === "loading") {
        body = <Muted><Spinner /></Muted>;
    } else if (state.status === "error") {
        body = <Output>{t.rich("seedicon.usage", { cmd: (chunks) => <Cmd>{chunks}</Cmd> })}</Output>;
    } else {
        body = (
            <>
                <Muted>{t("loadings.seedicon", { ms: state.ms })}</Muted>
                <div className="mt-2 flex flex-wrap gap-4">
                    {state.data.images.map(({ style, uri }) => (
                        <figure key={style} className="flex flex-col items-center gap-1">
                            {/* A data: URI rendered as an image cannot run script, whatever the seed. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={uri} alt={`seedicon ${style}: ${seed}`} width={72} height={72} />
                            <figcaption className="text-xs text-gray-500 dark:text-neutral-400/90">{style}</figcaption>
                        </figure>
                    ))}
                </div>
                <Output>
                    <div>{t("seedicon.same")}</div>
                    <Muted>
                        {t("seedicon.install")}{" "}
                        <a href="https://www.npmjs.com/package/seedicon" target="_blank" rel="noreferrer" className={LINK_CLASS}>
                            npm install seedicon
                        </a>
                    </Muted>
                </Output>
            </>
        );
    }

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            {body}
        </div>
    );
}

/* ------------------------------------------------------------- wordmark -- */

/** Longer words are capped by the terminal width and shrink to unreadable dots. */
const WORDMARK_MAX_LENGTH = 20;

/**
 * Width per character, in CSS pixels. PixelWordmark scales the word to span
 * its container, so without a cap "hi" would be drawn two hundred pixels tall;
 * this keeps short and long words at roughly the same letter height.
 */
const WORDMARK_PX_PER_CHAR = 80;

export function WordmarkMessage({ command, text }: { command: string; text: string }): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(20, 400);
    const word = (text.trim() || "@romulodm").slice(0, WORDMARK_MAX_LENGTH);

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.wordmark", { ms })}</Muted>
            {/*
                 * A fixed width rather than w-full: the interactive tab sizes to
                 * its content, so a percentage here would have nothing to
                 * resolve against and the canvas would fall back to 300px.
                 */}
            <div className="mt-2" style={{ width: `${Math.max(4, word.length) * WORDMARK_PX_PER_CHAR}px`, maxWidth: "100%" }}>
                <PixelWordmark text={word} />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ man -- */

export function ManMessage({ command, topic }: { command: string; topic: string }): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(10, 200);
    const entry = topic ? findEntry(topic) : undefined;

    if (!topic) {
        return (
            <div className="font-mono text-sm">
                <Prompt command={command} />
                <Output>
                    <div>{t("man.what")}</div>
                    <div>{t.rich("man.example", { cmd: (chunks) => <Cmd>{chunks}</Cmd> })}</div>
                </Output>
            </div>
        );
    }

    if (!entry) {
        return (
            <div className="font-mono text-sm">
                <Prompt command={command} />
                <Output>{t("man.missing", { command: topic })}</Output>
            </div>
        );
    }

    const synopsis = [
        entry.name,
        entry.options,
        entry.arg ? `<${t(`args.${entry.arg}`)}>` : null,
    ]
        .filter(Boolean)
        .join(" ");

    const title = `${entry.name.toUpperCase().replace(/ /g, "-")}(1)`;

    return (
        <div className="font-mono text-sm">
            <Prompt command={command} />
            <Muted>{t("loadings.man", { ms })}</Muted>

            <Output className="max-w-[36rem]">
                <div className="flex justify-between text-gray-500 dark:text-neutral-500">
                    <span>{title}</span>
                    <span>romulodm.dev</span>
                    <span>{title}</span>
                </div>

                <div className="mt-2 font-bold">{t("man.name")}</div>
                <div className="pl-6">{entry.name} - {t(`commands.${entry.key}`)}</div>

                <div className="mt-2 font-bold">{t("man.synopsis")}</div>
                <div className="pl-6"><Cmd>{synopsis}</Cmd></div>

                <div className="mt-2 font-bold">{t("man.description")}</div>
                <div className="pl-6">{t(`commands.${entry.key}`)}.</div>

                <div className="mt-2 font-bold">{t("man.bugs")}</div>
                <div className="pl-6">{t(`man.pages.${entry.key}`)}</div>
            </Output>
        </div>
    );
}

/* -------------------------------------------------- history / completion -- */

export function HistoryMessage({ entries }: { entries: string[] }): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(1, 20);
    const width = String(entries.length).length;

    return (
        <div className="font-mono text-sm">
            <Prompt command="history" />
            <Muted>{t("loadings.history", { ms })}</Muted>
            <Output>
                {entries.length === 0 ? (
                    t("history.empty")
                ) : (
                    <pre>{entries.map((entry, index) => `  ${String(index + 1).padStart(width)}  ${entry}`).join("\n")}</pre>
                )}
            </Output>
        </div>
    );
}

export function CompletionsMessage({ typed, options }: { typed: string; options: string[] }): JSX.Element {
    const t = useTranslations("terminal");
    const ms = useFakeLoadTime(1, 15);

    return (
        <div className="font-mono text-sm">
            <Prompt command={typed} />
            <Muted>{t("loadings.completions", { ms })}</Muted>
            <div className="flex flex-wrap gap-x-6 text-red-500 font-semibold max-w-[36rem]">
                {options.map((option) => (
                    <span key={option} className="whitespace-pre">{option}</span>
                ))}
            </div>
        </div>
    );
}

