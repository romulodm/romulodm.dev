import { FaGithub, FaLinkedin } from 'react-icons/fa';

const links = [
    {
        url: 'https://www.linkedin.com/in/romulo-de-moraes-918793258/',
        icon: <FaLinkedin />,
        color: '#0a66c2',
        title: 'LinkedIn',
        id: 'linkedin'
    },
    {
        url: 'https://github.com/romulodm',
        icon: <FaGithub />,
        color: '#333',
        title: 'GitHub',
        id: 'github'
    },
]

export default function Extras(){
    return(
        <div className="flex flex-col gap-3 w-full md:w-72 lg:mr-3">
            <div className="w-full bg-gray-50 border rounded border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 px-3 py-3.5">
                <div className="w-full justify-center dark:text-neutral-200 pb-3">
                    Tem alguma sugestão de postagem?
                </div>

                <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-950 hover:text-blue-900 font-medium rounded text-sm py-1 px-2">
                    Send suggestion
                </button>
            </div>

            <div className="w-full bg-gray-50 border rounded border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 px-3 py-4">
                <div className="w-full justify-center dark:text-neutral-200 pb-3">
                    Tem alguma sugestão de postagem?
                </div>

                <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-950 hover:text-blue-900 font-medium rounded text-sm py-1 px-2">
                    Send suggestion
                </button>
            </div>

        </div>
    )
}