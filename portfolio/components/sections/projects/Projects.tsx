import { FiGithub, FiAlertCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";

import ProjectCard from "./ProjectCard";
import { getMainProjects } from "./data";
import { getGitHubContributions } from "./github-contributions";

export default async function Projects() {
    const t = useTranslations("home");

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

    return (
        <div className="flex flex-col pt-5">
            {projectsData ? (
                <>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectsData.filteredAndOrderedProjects.map((project) => (
                            <ProjectCard key={project.source} project={project} />
                        ))}
                    </div>

                    <div className="w-full flex items-center justify-center">
                        <div className="flex mt-4 items-center gap-2 text-purple-800 dark:text-purple-500/90 font-bold">
                            <div className="flex items-center p-2 bg-purple-50 dark:bg-purple-600/30 dark:text-white border-2 rounded-md border-purple-800 dark:border-purple-1000">
                                <FiGithub />
                            </div>
                            <div>
                                + {projectsData.length - projectsData.filteredAndOrderedProjects.length}{" "}
                                {t("projects.public")}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <GitHubError message="Não foi possível carregar os projetos." />
            )}
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