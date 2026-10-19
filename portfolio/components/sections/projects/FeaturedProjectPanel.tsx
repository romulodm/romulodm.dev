"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AiTwotoneCode } from "react-icons/ai";
import { FaCodeBranch, FaStar } from "react-icons/fa6";
import { FiBookOpen, FiDownload, FiExternalLink } from "react-icons/fi";

import TechLogoIcon from "@/components/TechLogoIcon";
import { Link } from "@/i18n/navigation";
import { formatCount } from "@/lib/format-number";

import type { FeaturedLabels, FeaturedProjectView, FeaturedStackItem } from "./featured";

interface FeaturedProjectPanelProps {
    project: FeaturedProjectView;
    labels: FeaturedLabels;
    /** Position of `project` among the featured entries, from 0. */
    index: number;
    total: number;
}

/** Four-point star, the mark in front of each bullet. */
const BULLET_PATH =
    "M12 1C12 1 12 8 10 10C8 12 1 12 1 12C1 12 8 12 10 14C12 16 12 23 12 23C12 23 12 16 14 14C16 12 23 12 23 12C23 12 16 12 14 10C12 8 12 1 12 1Z";

/** Vertical distance between two progress ticks, in px. */
const TICK_STEP_PX = 10;

const SWAP_DURATION_MS = 300;
const SWAP_STAGGER_MS = 40;

/**
 * The pinned half of a featured entry: what the project is, what it is built
 * with, how it was received and where to go next. It swaps its contents whenever a
 * different card crosses the middle of the viewport (FeaturedProjects.tsx).
 *
 * The swap is a fade-and-rise per block, staggered top to bottom, run with the
 * Web Animations API rather than an animation library: the site has none in
 * its client bundle for this kind of work, and five short keyframe pairs do
 * not justify adding one. It is skipped on the first render (the panel should
 * simply be there when the section scrolls in) and for visitors who ask for
 * reduced motion.
 */
export default function FeaturedProjectPanel({
    project,
    labels,
    index,
    total,
}: FeaturedProjectPanelProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const hasRendered = useRef(false);

    useEffect(() => {
        if (!hasRendered.current) {
            hasRendered.current = true;
            return;
        }

        const node = contentRef.current;
        if (!node) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const animations = Array.from(node.children).map((child, index) =>
            child.animate(
                [
                    { opacity: 0, transform: "translateY(12px)" },
                    { opacity: 1, transform: "translateY(0)" },
                ],
                {
                    duration: SWAP_DURATION_MS,
                    delay: index * SWAP_STAGGER_MS,
                    easing: "ease-out",
                    // Hold the first keyframe during the delay, otherwise the
                    // later blocks flash at full opacity before their turn.
                    fill: "backwards",
                },
            ),
        );

        // Scrolling fast through the section swaps projects faster than the
        // animations finish; cancelling the old ones keeps them from piling up.
        return () => animations.forEach((animation) => animation.cancel());
    }, [project.id]);

    const accentStyle = { "--project-accent": project.accent } as CSSProperties;

    return (
        <div className="sticky top-28" style={accentStyle}>
            <div className="flex">
                {/* Outside the swapped content on purpose: the ticks slide and
                    recolour between projects instead of popping in with the
                    new text. */}
                <ProgressTicks index={index} total={total} />

                <div ref={contentRef} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {project.title}
                        </h3>
                        {project.year && (
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                                {project.year}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Counter
                            icon={<FaStar aria-hidden="true" />}
                            value={project.stars}
                            label={labels.stars}
                        />
                        <Counter
                            icon={<FaCodeBranch aria-hidden="true" />}
                            value={project.forks}
                            label={labels.forks}
                        />
                        {project.weeklyDownloads !== null && (
                            <Counter
                                icon={<FiDownload aria-hidden="true" />}
                                value={project.weeklyDownloads}
                                label={labels.downloads}
                                suffix={labels.perWeek}
                            />
                        )}
                    </div>

                    <p className="mt-2 text-sm text-neutral-600 xl:text-base dark:text-neutral-300">
                        {project.description}
                    </p>

                    <ul className="mt-4 flex flex-col gap-y-2 text-sm text-neutral-700 xl:text-base dark:text-neutral-300">
                        {project.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start">
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="me-2 mt-[3px] size-4 shrink-0 fill-[rgb(var(--project-accent))] drop-shadow-[0_0_10px_rgb(var(--project-accent)/0.8)]"
                                >
                                    <path d={BULLET_PATH} />
                                </svg>
                                <span>{bullet}</span>
                            </li>
                        ))}
                    </ul>

                    <ul className="mt-6 flex flex-wrap gap-1.5">
                        {project.stack.map((item) => (
                            <StackChip key={item.label} item={item} />
                        ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        {project.demo && (
                            <a
                                href={project.demo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-md bg-[rgb(var(--project-accent))] px-4 py-2 text-sm font-medium text-white transition-[background-color,filter] duration-300 hover:brightness-110"
                            >
                                <FiExternalLink aria-hidden="true" />
                                {labels.visit}
                            </a>
                        )}

                        <a
                            href={project.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md bg-purple-50 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-purple-200 dark:bg-neutral-800 dark:text-white/80 dark:hover:bg-neutral-700"
                        >
                            <AiTwotoneCode aria-hidden="true" />
                            {labels.code}
                        </a>

                        {project.blogHref && (
                            <BlogLink href={project.blogHref} label={labels.blog} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * One short tick per featured project, stacked vertically, with the current
 * one drawn long and in the project's accent. The stack slides so the current
 * tick always sits level with the title: ticks above it are the projects
 * already passed, ticks below are the ones still to come.
 *
 * Every tick keeps its key and only its transform, width and colour change,
 * so moving to the next project is a transition rather than a re-render of
 * the whole stack. Decorative for assistive technology, which gets the
 * project itself from the panel's content.
 */
function ProgressTicks({ index, total }: { index: number; total: number }) {
    return (
        <div aria-hidden="true" className="relative me-4 w-6 shrink-0">
            {Array.from({ length: total }, (_, tick) => {
                const active = tick === index;
                return (
                    <span
                        key={tick}
                        // top-4 puts the current tick on the middle of the
                        // title's first line (text-2xl, 32px line height).
                        className={`absolute left-0 top-4 h-0.5 rounded-full transition-[transform,width,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${
                            active
                                ? "w-6 bg-[rgb(var(--project-accent))] shadow-[0_0_16px_rgb(var(--project-accent)/0.9)]"
                                : "w-3 bg-neutral-300 dark:bg-neutral-600"
                        }`}
                        style={{ transform: `translateY(${(tick - index) * TICK_STEP_PX}px)` }}
                    />
                );
            })}
        </div>
    );
}

function Counter({
    icon,
    value,
    label,
    suffix,
}: {
    icon: ReactNode;
    value: number;
    label: string;
    suffix?: string;
}) {
    return (
        <span
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400"
            title={label}
        >
            {icon}
            {formatCount(value)}
            {suffix && (
                <span aria-hidden="true" className="text-xs opacity-70">
                    {suffix}
                </span>
            )}
            <span className="sr-only">{label}</span>
        </span>
    );
}

function StackChip({ item }: { item: FeaturedStackItem }) {
    return (
        <li className="flex items-center gap-1.5 rounded-md border border-border bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-white/5">
            {item.logo && <TechLogoIcon logo={item.logo} className="size-3.5" decorative />}
            <span className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                {item.label}
            </span>
        </li>
    );
}

function BlogLink({ href, label }: { href: string; label: string }) {
    const className =
        "flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-white/80 dark:hover:bg-neutral-800";

    if (href.startsWith("/")) {
        return (
            <Link href={href} className={className}>
                <FiBookOpen aria-hidden="true" />
                {label}
            </Link>
        );
    }

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
            <FiBookOpen aria-hidden="true" />
            {label}
        </a>
    );
}
