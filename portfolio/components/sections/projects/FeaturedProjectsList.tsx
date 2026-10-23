"use client";

import { useId, useState, type CSSProperties } from "react";
import { FiChevronDown } from "react-icons/fi";

import FeaturedProjectCard from "./FeaturedProjectCard";
import {
    ProjectActions,
    ProjectBullets,
    ProjectCounters,
    ProjectDescription,
    ProjectHeading,
    ProjectStack,
} from "./FeaturedProjectDetails";
import type { FeaturedLabels, FeaturedProjectView } from "./featured";

interface FeaturedProjectsListProps {
    projects: FeaturedProjectView[];
    labels: FeaturedLabels;
}

/**
 * Detailed view of the projects section below `lg`, where the pinned 60/40
 * split of FeaturedProjects.tsx does not fit. Each project is stacked as its
 * card followed by its text, and the text opens on the title and the
 * description only: the counters, bullets, stack and links sit behind a
 * "read more" toggle, so four projects do not turn into four screens of
 * bullets on a phone.
 */
export default function FeaturedProjectsList({ projects, labels }: FeaturedProjectsListProps) {
    return (
        <div className="flex flex-col gap-y-14 pt-4">
            {projects.map((project) => (
                <FeaturedProjectEntry key={project.id} project={project} labels={labels} />
            ))}
        </div>
    );
}

/**
 * The collapsed part animates its height with a grid row going from 0fr to
 * 1fr, which transitions to the content's real height without measuring it.
 * While collapsed the part is `inert`, so its links leave the tab order and
 * the accessibility tree instead of being focusable at zero height. The
 * content stays in the server-rendered HTML either way.
 */
function FeaturedProjectEntry({
    project,
    labels,
}: {
    project: FeaturedProjectView;
    labels: FeaturedLabels;
}) {
    const [expanded, setExpanded] = useState(false);
    const detailsId = useId();

    const accentStyle = { "--project-accent": project.accent } as CSSProperties;

    return (
        <article style={accentStyle}>
            <FeaturedProjectCard project={project} labels={labels} />

            <div className="mt-5 px-1">
                <ProjectHeading project={project} />
                <ProjectDescription project={project} className="mt-2" />

                <div
                    id={detailsId}
                    inert={!expanded}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                >
                    {/* Clips the content while the row is shorter than it;
                        the padding keeps the bullet glow and the button focus
                        rings from being cut at the edges. */}
                    <div className="-mx-1 min-h-0 overflow-hidden px-1">
                        <ProjectCounters project={project} labels={labels} className="mt-4" />
                        <ProjectBullets project={project} className="mt-4" />
                        <ProjectStack project={project} className="mt-6" />
                        <ProjectActions project={project} labels={labels} className="mb-1 mt-6" />
                    </div>
                </div>

                {/* The accent is a 700 shade picked to carry white text, so it
                    already reads on the light background; on the dark one it
                    is too dim and gets lifted with a brightness filter. */}
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    onClick={() => setExpanded((open) => !open)}
                    className="mt-3 flex items-center gap-1 rounded-md py-1 text-sm font-semibold text-[rgb(var(--project-accent))] dark:brightness-150"
                >
                    {expanded ? labels.less : labels.more}
                    <FiChevronDown
                        aria-hidden="true"
                        className={`size-4 transition-transform duration-300 motion-reduce:transition-none ${
                            expanded ? "rotate-180" : ""
                        }`}
                    />
                </button>
            </div>
        </article>
    );
}
