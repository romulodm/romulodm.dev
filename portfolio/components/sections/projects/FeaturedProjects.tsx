"use client";

import { useEffect, useRef, useState } from "react";

import FeaturedProjectCard from "./FeaturedProjectCard";
import FeaturedProjectPanel from "./FeaturedProjectPanel";
import type { FeaturedLabels, FeaturedProjectView } from "./featured";

interface FeaturedProjectsProps {
    projects: FeaturedProjectView[];
    labels: FeaturedLabels;
}

/**
 * Detailed view of the projects section: a 60/40 split where the cards scroll
 * on the left and the panel on the right stays pinned, swapping to whichever
 * project is in front of the reader.
 *
 * Desktop only. Projects.tsx never shows it below `lg`, where a 40%
 * column is too narrow for the panel and a pinned element eats half of a
 * phone screen; small screens keep the simple grid.
 *
 * Switching rule: the active project is the last one whose card's top edge
 * is above the middle of the viewport, so a project takes over exactly as its
 * card's top crosses the midline. "Card nearest the centre" sounds equivalent
 * but is not: it switches while the previous card still fills most of the
 * screen, because the next card's top is already closer to the centre than
 * the current card's middle.
 *
 * The rule is evaluated from the card positions on scroll, not from an
 * IntersectionObserver watching a band on the midline. The observer only
 * reports cards whose state changed between two frames, so any jump that
 * carries a whole card across the band in one frame (scrollTo, an anchor
 * link, the End key, scroll restoration on back navigation) never reports
 * that card and leaves the panel on a project that is long gone. One
 * getBoundingClientRect call per featured card per animation frame costs
 * nothing next to that.
 */
export default function FeaturedProjects({ projects, labels }: FeaturedProjectsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let frame = 0;

        const update = () => {
            frame = 0;
            // While the view is hidden (a screen below `lg`) every card measures as a zero rect at the top of the
            // viewport, which would read as "all of them crossed" and select
            // the last project. Leave the state alone until it has layout.
            if (container.offsetHeight === 0) return;

            const midline = window.innerHeight / 2;
            let next = 0;
            cardRefs.current.forEach((node, index) => {
                if (node && node.getBoundingClientRect().top <= midline) next = index;
            });
            setActiveIndex(next);
        };

        // At most one measurement per frame, however many scroll events the
        // browser fires in between.
        const schedule = () => {
            if (frame === 0) frame = window.requestAnimationFrame(update);
        };

        // The ResizeObserver covers what scroll events miss: the first
        // measurement (it fires once on observe), and window resizes that
        // reflow the cards or cross `lg`, where the view goes from
        // display:none to full height without any scrolling.
        const resizeObserver = new ResizeObserver(schedule);
        resizeObserver.observe(container);
        window.addEventListener("scroll", schedule, { passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("scroll", schedule);
            if (frame !== 0) window.cancelAnimationFrame(frame);
        };
    }, [projects.length]);

    // Guards the frame where the list shrank (a repo dropped out of the
    // GitHub response on revalidation) before the next measurement.
    const active = projects[Math.min(activeIndex, projects.length - 1)];
    if (!active) return null;

    return (
        <div ref={containerRef} className="relative flex w-full pt-4">
            <div className="flex w-[60%] flex-col gap-y-24 xl:gap-y-32">
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        ref={(node) => {
                            cardRefs.current[index] = node;
                        }}
                    >
                        <FeaturedProjectCard project={project} labels={labels} />
                    </div>
                ))}
            </div>

            {/* Stretches to the height of the card column (flex default), which
                is what gives the sticky panel inside it room to stay pinned. */}
            <div className="w-[40%] py-4 pl-10">
                <FeaturedProjectPanel
                    project={active}
                    labels={labels}
                    index={projects.indexOf(active)}
                    total={projects.length}
                />
            </div>
        </div>
    );
}
