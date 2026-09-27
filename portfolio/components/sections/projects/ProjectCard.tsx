"use client";

import { useLocale, useTranslations } from "next-intl";
import { IoIosCode } from "react-icons/io";
import { FiDownload, FiExternalLink, FiGithub } from "react-icons/fi";
import { AiTwotoneCode } from "react-icons/ai";
import { FaCodeBranch, FaStar } from "react-icons/fa6";
import { pixels } from "seedicon/pixels";

import { formatCount } from "@/lib/format-number";
import { Project } from "./data";

/**
 * Side of the icon square, in px: the 16px react-icons glyph plus the 12px of
 * padding it sits in on each side. The seedicon avatar fills that square instead
 * of sitting inside it, so its container drops the padding and the card keeps the
 * exact same footprint either way.
 */
const ICON_BOX = 40;

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const t = useTranslations("home");
    const locale = useLocale();

    // As descrições são escritas à mão em data.ts, em pt e en. Qualquer outro
    // locale cai no inglês em vez de deixar o card sem texto.
    const description =
        locale === "pt" ? project.descriptions.pt : project.descriptions.en;

    // Para um pacote publicado, downloads semanais dizem o que forks não dizem.
    // `null` (projeto sem npm, ou API do npm fora do ar) mantém os forks.
    const weeklyDownloads = project.weeklyDownloads;

    return (
        <div className="flex h-full px-4 flex-col border rounded-lg border-border dark:bg-neutral-900/60">
            <div className="flex mt-4 items-center gap-2">
                <div
                    className={`flex shrink-0 items-center border rounded-md border-neutral-200 text-neutral-700 dark:border-neutral-600 dark:text-white dark:bg-neutral-800 ${
                        // The avatar is clipped by this box's own `rounded-md` rather than
                        // by a radius of its own, so its corners match every other rounded
                        // element on the card exactly and nothing rounds twice.
                        project.iconSeed ? "overflow-hidden" : "p-3"
                    }`}
                >
                    {project.iconSeed ? (
                        /*
                         * Imported from "seedicon/pixels", the single-style entry point,
                         * and not from the package root: the root resolves styles by name,
                         * so it references all seventeen renderers and no bundler can drop
                         * the sixteen this card never calls (~19KB gz for one small icon).
                         *
                         * The markup goes in raw because `pixels()` returns an SVG string.
                         * It is safe as innerHTML — the input is a constant seed from
                         * data.ts, never anything a visitor or the GitHub API supplies —
                         * and it is deterministic, so the server render and the client
                         * render produce byte-identical markup and hydration matches.
                         * `shape: "square"` also keeps the markup free of the <clipPath>
                         * the rounded shapes need, whose id is global to the document.
                         */
                        <span
                            // `shrink-0` on both this span and the box around it is what
                            // keeps the square square. The title next to it is `w-full`, so
                            // the row hands the icon whatever is left and a flex item is
                            // shrinkable by default: the 40px SVG was being squeezed to 35px
                            // wide while keeping its 40px height. Padding does not shrink,
                            // which is why the GitHub glyph never showed the problem.
                            className="flex shrink-0"
                            style={{ width: ICON_BOX, height: ICON_BOX }}
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{
                                __html: pixels({
                                    seed: project.iconSeed,
                                    size: ICON_BOX,
                                    shape: "square",
                                }),
                            }}
                        />
                    ) : (
                        <FiGithub />
                    )}
                </div>

                <div className="w-full min-w-0 items-center flex justify-between gap-2 text-gray-900 dark:text-neutral-300">
                    {/* `min-w-0` + `truncate`: a repo name has no break points, so a long
                        one (modernlivemessenger.com.br) would push the Visit button out of
                        the card on narrower columns instead of wrapping. */}
                    <div className="min-w-0 truncate" title={project.title}>{project.title}</div>

                    {project.demo && (
                        <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-2 p-2 w-24 justify-center font-medium bg-purple-800 hover:bg-purple-700 dark:bg-purple-800/40 dark:hover:dark:bg-purple-800/50 text-white rounded-md"
                        >
                            <FiExternalLink />
                            {t("projects.preview")}
                        </a>
                    )}
                </div>
            </div>

            <div className="flex py-2 items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                <IoIosCode />
                <div>{project.language} {project.extraLanguages}</div>
            </div>

            <div className="flex flex-1 py-2 items-start gap-2 text-sm text-gray-500 dark:text-neutral-500">
                {description}
            </div>

            <div className="flex mt-auto py-2 items-center justify-between text-sm text-gray-500">
                <div className="flex gap-3">
                    <div className="flex items-center gap-1 dark:text-neutral-400">
                        <FaStar />
                        {formatCount(project.interactions.stars)}
                    </div>

                    {weeklyDownloads !== null ? (
                        <div className="flex items-center gap-1 dark:text-neutral-400">
                            <FiDownload />
                            {formatCount(weeklyDownloads)}
                            <span className="text-xs opacity-70">
                                {t("projects.downloadsWeek")}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 dark:text-neutral-400">
                            <FaCodeBranch />
                            {formatCount(project.interactions.forks)}
                        </div>
                    )}
                </div>

                <a
                    href={project.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 w-24 justify-center font-semibold bg-purple-50 hover:bg-purple-200 text-gray-500 dark:text-white/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md"
                >
                    <AiTwotoneCode />
                    {t("projects.code")}
                </a>
            </div >
        </div >
    );
}
