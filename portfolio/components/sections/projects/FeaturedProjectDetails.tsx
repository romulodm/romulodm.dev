import type { ReactNode } from "react";
import { AiTwotoneCode } from "react-icons/ai";
import { FaCodeBranch, FaStar } from "react-icons/fa6";
import { FiBookOpen, FiDownload, FiExternalLink } from "react-icons/fi";

import TechLogoIcon from "@/components/TechLogoIcon";
import { Link } from "@/i18n/navigation";
import { formatCount } from "@/lib/format-number";

import type { FeaturedLabels, FeaturedProjectView, FeaturedStackItem } from "./featured";

/**
 * The text blocks of a featured entry, shared by the pinned panel on desktop
 * (FeaturedProjectPanel.tsx) and the stacked list below `lg`
 * (FeaturedProjectsList.tsx), so the two layouts never drift apart.
 *
 * Each block renders a single root element and takes its outer spacing as
 * `className`: the panel animates its blocks one by one (it walks the direct
 * children of its content node), and the two layouts space and order them
 * differently.
 *
 * Every block reads the accent from `--project-accent`, which the caller sets
 * on an ancestor.
 */

interface BlockProps {
    project: FeaturedProjectView;
    className?: string;
}

interface LabelledBlockProps extends BlockProps {
    labels: FeaturedLabels;
}

/** Four-point star, the mark in front of each bullet. */
const BULLET_PATH =
    "M12 1C12 1 12 8 10 10C8 12 1 12 1 12C1 12 8 12 10 14C12 16 12 23 12 23C12 23 12 16 14 14C16 12 23 12 23 12C23 12 16 12 14 10C12 8 12 1 12 1Z";

export function ProjectHeading({ project, className = "" }: BlockProps) {
    return (
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
            <h3 className="text-xl font-semibold text-neutral-900 sm:text-2xl dark:text-neutral-100">
                {project.title}
            </h3>
            {project.year && (
                <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                    {project.year}
                </span>
            )}
        </div>
    );
}

export function ProjectCounters({ project, labels, className = "" }: LabelledBlockProps) {
    return (
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
            <Counter icon={<FaStar aria-hidden="true" />} value={project.stars} label={labels.stars} />
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
    );
}

export function ProjectDescription({ project, className = "" }: BlockProps) {
    return (
        <p className={`text-sm text-neutral-600 xl:text-base dark:text-neutral-300 ${className}`}>
            {project.description}
        </p>
    );
}

export function ProjectBullets({ project, className = "" }: BlockProps) {
    return (
        <ul
            className={`flex flex-col gap-y-2 text-sm text-neutral-700 xl:text-base dark:text-neutral-300 ${className}`}
        >
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
    );
}

export function ProjectStack({ project, className = "" }: BlockProps) {
    return (
        <ul className={`flex flex-wrap gap-1.5 ${className}`}>
            {project.stack.map((item) => (
                <StackChip key={item.label} item={item} />
            ))}
        </ul>
    );
}

export function ProjectActions({ project, labels, className = "" }: LabelledBlockProps) {
    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
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

            {project.blogHref && <BlogLink href={project.blogHref} label={labels.blog} />}
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
