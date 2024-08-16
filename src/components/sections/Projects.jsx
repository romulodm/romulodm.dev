import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { FiGithub } from "react-icons/fi";

import ProjectCard from "./ProjectCard";
import { getMainProjects } from "../../data/getProjects";
import ProjectCardSkeleton from "./ProjectCardSkeleton";

export default function Projects() {
    const { t } = useTranslation('home');

    const [isLoading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [projectsLength, setProjectsLength] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getMainProjects().then((data) => {
            setProjectsLength(data.length)
            setProjects(data.filteredAndOrderedProjects);
        }).catch((error) => {
            setError(error);
        }).finally(() => {
            setLoading(false);
        });
    }, []);
    

    if (isLoading) {
        return <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill().map((_, index) => (
                        <ProjectCardSkeleton key={index} />
                    ))}
                </div>
    }

    return (
        <div className="flex flex-col pt-5">
            <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <ProjectCard key={project.source} project={project} />
                ))}
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="flex mt-4 items-center gap-2 text-purple-800 font-bold">
                    <div className="flex items-center p-2 bg-purple-50 border border-purple-800 rounded-md">
                        <FiGithub/>
                    </div>
                    <div>+ {projectsLength - projects.length} {t('projects.public')}</div>
                </div>
            </div>
        </div>
    );
}
