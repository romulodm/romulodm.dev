import { IoIosCode } from "react-icons/io";
import { FiExternalLink, FiGithub } from "react-icons/fi";
import { AiTwotoneCode } from "react-icons/ai";
import { FaCodeBranch, FaStar } from "react-icons/fa6";

export default function ProjectCard({project}){
    return(
        <div className="flex px-4 flex-col border rounded-lg">
            <div className="flex mt-4 items-center gap-2">
                <div className="flex items-center p-3 border rounded-md">
                    <FiGithub/>
                </div>

                <div className="w-full items-center flex justify-between">
                    <div>{project.title}</div>

                    {project.demo && (
                        <a
                            href={project.demo}
                            target="_blank"
                            className="flex items-center gap-2 p-2 w-24 justify-center font-medium bg-purple-800 hover:bg-purple-700 text-white rounded-md"
                        >
                            <FiExternalLink />
                            Preview
                        </a>
                    )}

                </div>
            </div>

            <div className="flex py-2 items-center gap-2 text-sm text-gray-500">
                <IoIosCode/>
                <div>{project.language} {project.extraLanguages}</div>
            </div>

            <div className="flex py-2 items-center gap-2 text-sm text-gray-500">
                {project.description}
            </div>

            <div className="flex py-2 items-center justify-between text-sm text-gray-500">
                <div className="flex gap-3">    
                    <div className="flex items-center gap-1">
                        <FaStar />
                        {project.interactions.stars}
                    </div>

                    <div className="flex items-center gap-1">
                        <FaCodeBranch />
                        {project.interactions.forks}
                    </div>
                </div>
                
                <a
                    href={project.source}
                    target="_blank"
                    className="flex items-center gap-2 p-3 w-24 justify-center font-semibold bg-purple-50 hover:bg-purple-200 text-gray-500 rounded-md"
                >
                    <AiTwotoneCode />
                    Código
                </a>
            </div>


        </div>
    )
}