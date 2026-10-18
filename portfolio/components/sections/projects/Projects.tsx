import { existsSync } from "node:fs";
import path from "node:path";

import { FiAlertCircle } from "react-icons/fi";
import { getTranslations } from "next-intl/server";

import FeaturedProjects from "./FeaturedProjects";
import ProjectCard from "./ProjectCard";
import { getMainProjects, type Project } from "./data";
import { TECH_LOGOS, type TechLogo } from "@/lib/tech-logos";

import {
    FEATURED_PROJECTS,
    type FeaturedHover,
    type FeaturedLabels,
    type FeaturedProjectView,
    type FeaturedScreenshot,
    type FeaturedStackItem,
    type StackItem,
} from "./featured";
import { getGitHubContributions } from "./github-contributions";

/** The two calls buildFeatured needs from the `home` translator. */
interface Messages {
    text: (key: string) => string;
    raw: (key: string) => unknown;
}

export default async function Projects() {
    const t = await getTranslations("home");

    const [projectsResult, contributionResult] = await Promise.allSettled([
        getMainProjects(),
        getGitHubContributions("romulodm"),
    ]);

    const projectsData = projectsResult.status === "fulfilled" ? projectsResult.value : null;
    const contributionData = contributionResult.status === "fulfilled" ? contributionResult.value : null;

    if (projectsResult.status === "rejected") {
        console.error("[Projects] Erro ao buscar projetos:", projectsResult.reason);
    }
    if (contributionResult.status === "rejected") {
        console.error("[Projects] Erro ao buscar contribuições:", contributionResult.reason);
    }

    if (!projectsData) {
        return (
            <div className="flex flex-col pt-5">
                <GitHubError message={t("projects.loadError")} />
            </div>
        );
    }

    const all = projectsData.filteredAndOrderedProjects;

    const featured = buildFeatured(all, {
        text: (key) => t(key),
        raw: (key) => t.raw(key),
    });

    // Pinned repos without a case-study entry. On desktop they sit in the
    // simple grid under the detailed view; below `lg` every project is a
    // simple card, featured or not.
    const featuredIds = new Set(featured.map((project) => project.id));
    const rest = all.filter((project) => !featuredIds.has(project.title));

    const labels: FeaturedLabels = {
        visit: t("projects.preview"),
        code: t("projects.code"),
        blog: t("projects.blogPost"),
        stars: t("projects.stars"),
        forks: t("projects.forks"),
        downloads: t("projects.downloads"),
        perWeek: t("projects.downloadsWeek"),
        open: t("projects.open"),
    };

    return (
        <div className="flex w-full flex-col pt-5">
            {/* Both layouts are rendered and CSS picks one, so the breakpoint
                switch needs no client code and no layout shift on hydration.
                If no featured repo came back from GitHub, the full grid is all
                there is, at every width. */}
            <div className={featured.length > 0 ? "lg:hidden" : undefined}>
                <ProjectGrid projects={all} />
            </div>

            {featured.length > 0 && (
                <div className="hidden lg:block">
                    <FeaturedProjects projects={featured} labels={labels} />
                    {rest.length > 0 && (
                        <div className="mt-4">
                            <ProjectGrid projects={rest} />
                        </div>
                    )}
                </div>
            )}

            <div className="w-full flex items-center justify-center">
                <div className="flex mt-4 items-center gap-2 text-purple-800 dark:text-purple-500/90 font-bold">
                    <div>
                        + {projectsData.length - projectsData.filteredAndOrderedProjects.length}{" "}
                        {t("projects.public")}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Merges each featured config with the GitHub data the simple grid already
 * has and resolves its copy, so the client components receive plain strings.
 * A featured repo that is not among the pinned projects (renamed, made
 * private, or missing from data.ts) is dropped rather than rendered without
 * its title, stars and links.
 */
function buildFeatured(projects: Project[], messages: Messages): FeaturedProjectView[] {
    const byTitle = new Map(projects.map((project) => [project.title, project]));

    return FEATURED_PROJECTS.flatMap((config) => {
        const project = byTitle.get(config.repo);
        if (!project) return [];

        const created = new Date(project.createdAt);
        // GitHub's `homepage` is an empty string, not null, on repos that had
        // one set and then cleared.
        const demo = project.demo || null;

        return [
            {
                id: config.repo,
                title: config.name ?? project.title,
                tagline: messages.text(`projects.featured.${config.messagesKey}.tagline`),
                description: project.descriptionKey
                    ? messages.text(`projects.items.${project.descriptionKey}`)
                    : "",
                bullets: toStringList(
                    messages.raw(`projects.featured.${config.messagesKey}.bullets`),
                ),
                year: Number.isNaN(created.getTime()) ? null : String(created.getFullYear()),
                stars: project.interactions.stars,
                forks: project.interactions.forks,
                weeklyDownloads: project.weeklyDownloads,
                demo,
                source: project.source,
                host: hostOf(demo) ?? `github.com/romulodm/${config.repo}`,
                blogHref: config.blogHref ?? null,
                stack: config.stack.map(resolveStackItem),
                gradient: config.gradient,
                accent: config.accent,
                hero: onDisk(config.hero),
                hover: resolveHover(config.hover, project.iconSeed),
                iconSeed: project.iconSeed,
            },
        ];
    });
}

/**
 * `t.raw` hands back whatever the JSON holds. A locale where the bullets were
 * left as a single string, or not translated yet, should drop the list rather
 * than crash the home page.
 */
function toStringList(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * Swaps a logo name for the logo itself, here on the server, so the client
 * bundle carries only the handful of logos the chips use and never the whole
 * registry (its inline SVGs alone are several KB).
 */
function resolveStackItem(item: StackItem): FeaturedStackItem {
    if ("label" in item) return { label: item.label, logo: null };
    const logo: TechLogo = TECH_LOGOS[item.logo];
    return { label: logo.name, logo };
}

/**
 * The screenshot, if its file is actually in /public. The captures are made by
 * a script run by hand (scripts/capture-project-screens.mjs), so the config can
 * name a file that has not been generated yet; dropping it here makes the card
 * fall back to its placeholder instead of drawing a broken image.
 *
 * `process.cwd()` is the portfolio folder both under `next dev` and in the
 * standalone build (server.js changes into its own directory, and the
 * Dockerfile copies /public next to it), the same assumption lib/legal.ts
 * makes. The check runs on the server, once per revalidation of the section.
 */
function onDisk(screenshot: FeaturedScreenshot | undefined): FeaturedScreenshot | null {
    if (!screenshot) return null;
    return existsSync(path.join(process.cwd(), "public", screenshot.src)) ? screenshot : null;
}

/**
 * Downgrades a hover that cannot be drawn to the plain tilt: a second screen
 * or app window whose image is missing, or a phone for a project without an
 * icon seed to fill it with.
 */
function resolveHover(hover: FeaturedHover, iconSeed: string | null): FeaturedHover {
    if (hover.kind === "second-screen") {
        const screen = onDisk(hover.screen);
        return screen ? { kind: "second-screen", screen } : { kind: "tilt" };
    }
    if (hover.kind === "window") {
        const window = onDisk(hover.window);
        return window ? { ...hover, window } : { kind: "tilt" };
    }
    if (hover.kind === "phone" && !iconSeed) return { kind: "tilt" };
    return hover;
}

function hostOf(url: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).host;
    } catch {
        return null;
    }
}

function ProjectGrid({ projects }: { projects: Project[] }) {
    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
                <ProjectCard key={project.source} project={project} />
            ))}
        </div>
    );
}

function GitHubError({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-4 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
            <FiAlertCircle className="shrink-0" />
        </div>
    );
}
