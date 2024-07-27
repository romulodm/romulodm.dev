import React, { useEffect, useState } from "react";
import { FiGithub } from "react-icons/fi";
import { FaArrowRightLong } from "react-icons/fa6";

import ProjectCard from "./ProjectCard";
import { getMainProjects } from "../../data/getProjects";
import { Link, NavLink } from "react-router-dom";
import ProjectCardSkeleton from "./ProjectCardSkeleton";

export default function Projects() {
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
                    <div>+ {projectsLength - projects.length} repositórios públicos</div>
                </div>
            </div>
            

            <hr className="mt-6 mb-5"/>

            <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 border rounded-lg flex-col sm:flex-row text-center sm:text-left items-center">
                <div className="mb-2 sm:mb-0">
                    <p className="text-slate-700 font-bold mb-1 text-lg sm:text-2xl">Ficou interessado? 🤖</p>
                    <p className="text-slate-500 text-sm sm:text-lg">Você pode ver mais dos meus projetos e tentativas.</p>
                </div>
                <Link to="https://github.com/romulodm?tab=repositories" target="_blank">
                    <button className="flex min-w-44 px-5 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-purple-800 hover:bg-purple-700 rounded-lg text-white">
                        Ver mais projetos
                        <FaArrowRightLong/>
                    </button>
                </Link>
            </div>
        </div>
    );
}
