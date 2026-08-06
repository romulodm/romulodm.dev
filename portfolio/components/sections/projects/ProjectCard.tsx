"use client";

import { useTranslations } from "next-intl";
import { IoIosCode } from "react-icons/io";
import { FiExternalLink, FiGithub } from "react-icons/fi";
import { AiTwotoneCode } from "react-icons/ai";
import { FaCodeBranch, FaStar } from "react-icons/fa6";

import { Project } from "./data";

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const t = useTranslations("home");

    return (
        <div className="flex px-4 flex-col border rounded-lg border-border dark:bg-neutral-900/60">
            <div className="flex mt-4 items-center gap-2">
                <div className="flex items-center p-3 border rounded-md border-neutral-200 text-neutral-700 dark:border-neutral-600 dark:text-white dark:bg-neutral-800">
                    <FiGithub />
                </div>

                <div className="w-full items-center flex justify-between text-gray-900 dark:text-neutral-300">
                    <div>{project.title}</div>

                    {project.demo && (
                        <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 w-24 justify-center font-medium bg-purple-800 hover:bg-purple-700 dark:bg-purple-800/40 dark:hover:dark:bg-purple-800/50 text-white rounded-md"
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

            <div className="flex py-2 items-center gap-2 text-sm text-gray-500 dark:text-neutral-500">
                {project.description}
            </div>

            <div className="flex py-2 items-center justify-between text-sm text-gray-500">
                <div className="flex gap-3">
                    <div className="flex items-center gap-1 dark:text-neutral-400">
                        <FaStar />
                        {project.interactions.stars}
                    </div>
                    <div className="flex items-center gap-1 dark:text-neutral-400">
                        <FaCodeBranch />
                        {project.interactions.forks}
                    </div>
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