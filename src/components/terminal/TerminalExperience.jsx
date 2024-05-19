import { useEffect, useState } from "react";
import Experience from "../experience/Experience";
import TypeWriter from "../TypeWriter";

export default function TerminalExperience() {
    const [loadingTime, setLoadingTime] = useState();

    useEffect(() => {
        setLoadingTime(Math.floor(Math.random() * 300));
      }, []);
    
    return(
        <div className="flex flex-col gap-4">
            <div className="font-mono text-sm">
                <div className="text-gray-500 dark:text-gray-400">
                Powershell 7.3.4
                <br />
                Loading system profile took {loadingTime} ms.
                </div>
                <div className="flex flex-nowrap">
                <div className="text-blue-600 font-semibold">root@romulodm:~$&nbsp;</div>
                <div className="whitespace-nowrap font-semibold">{`romulo.exe --experience`}</div>
                <TypeWriter/>
                </div>
            </div>

            <div>
                <Experience/>
            </div>


        </div>
    )
}