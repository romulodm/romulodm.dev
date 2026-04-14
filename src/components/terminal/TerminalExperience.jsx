import { useTranslation } from "react-i18next";
import Education from "../infos/Education";
import Experience from "../infos/Experience";

export default function TerminalExperience({ loadingTime }) {
    const { t } = useTranslation('terminal');

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
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`romulo.exe --${t('xp')}`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loading-xp-title')}
                    <br />
                    {t('loading-xp')} {anotherTime} ms.
                </div>
            </div>

            <div>
                <Experience/>
            </div>

            <div className="font-mono text-sm">
                <div className="flex flex-nowrap gap-1">
                <div className="text-blue-600 font-semibold dark:text-sky-400">root@romulodm:~$&nbsp;</div>
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">{`romulo.exe --${t('education')}`}</div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t('loading-education-title')}
                    <br />
                    {t('loading-education')} {loadingTime} ms.
                </div>
            </div>

            <div className="pb-4">
                <Education/>
            </div>
        </div>
    );
}
