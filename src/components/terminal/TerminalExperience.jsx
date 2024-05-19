import { useEffect, useState } from "react";
import Experience from "../experience/Experience";

export default function TerminalExperience({ loadingTime }) {
    return(
        <div className="flex flex-col gap-4">
            <div className="font-mono text-sm">
                <div className="text-gray-500 dark:text-gray-400">
                    Powershell 3.9.22
                </div>
                <div className="flex flex-nowrap">
                    <div className="text-blue-600 font-semibold">root@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold">{`romulo.exe --experience`}</div>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                Lookin for experiences...
                <br />
                Loading system profile took {loadingTime} ms.
                </div>
            </div>

            <div>
                <Experience/>
            </div>


        </div>
    )
}