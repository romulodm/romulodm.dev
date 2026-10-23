"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import {
    ProjectActions,
    ProjectBullets,
    ProjectCounters,
    ProjectDescription,
    ProjectHeading,
    ProjectStack,
} from "./FeaturedProjectDetails";
import type { FeaturedLabels, FeaturedProjectView } from "./featured";

interface FeaturedProjectPanelProps {
    project: FeaturedProjectView;
    labels: FeaturedLabels;
    /** Position of `project` among the featured entries, from 0. */
    index: number;
    total: number;
}

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
                    <ProjectHeading project={project} />
                    <ProjectCounters project={project} labels={labels} className="mt-1" />
                    <ProjectDescription project={project} className="mt-2" />
                    <ProjectBullets project={project} className="mt-4" />
                    <ProjectStack project={project} className="mt-6" />
                    <ProjectActions project={project} labels={labels} className="mt-6" />
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
