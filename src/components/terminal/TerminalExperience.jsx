import Education from "../infos/Education";
import Experience from "../infos/Experience";

export default function TerminalExperience({ loadingTime }) {
    // Verificar se loadingTime é um número válido
    const parsedLoadingTime = parseFloat(loadingTime);
    const anotherTime = !isNaN(parsedLoadingTime) ? parsedLoadingTime / 2 + 3 : 0;

    return (
        <div className="flex flex-col gap-4">
            <div className="font-mono text-sm">
                <div className="text-gray-500 dark:text-neutral-400/90">
                    Powershell 3.9.22
                </div>
                <div className="flex flex-nowrap gap-1">
                    <div className="text-blue-600 font-semibold dark:text-sky-400">root@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`romulo.exe --experience`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    Lookin for experiences...
                    <br />
                    Loading system experiences took {anotherTime} ms.
                </div>
            </div>

            <div>
                <Experience/>
            </div>

            <div className="font-mono text-sm">
                <div className="flex flex-nowrap gap-1">
                <div className="text-blue-600 font-semibold dark:text-sky-400">root@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`romulo.exe --education`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    Lookin for education...
                    <br />
                    Loading system education took {loadingTime} ms.
                </div>
            </div>

            <div className="pb-4">
                <Education/>
            </div>
        </div>
    );
}
