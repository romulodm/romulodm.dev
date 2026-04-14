import Comment from "./Comment";

import { MdSecurity } from 'react-icons/md';
import { SiTeespring } from "react-icons/si";
import { FaCode } from 'react-icons/fa';
import { useTranslation } from "react-i18next";

export default function Development({ step }){
    const { t } = useTranslation("vision")

    return(
        <div className="absolute min-w-72 top-[58%] left-1/2 transform -translate-x-[50%] flex flex-col sm:flex-row gap-2">
            <button className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-700 dark:text-neutral-200 border-2 dark:border-neutral-500/80 shadow-lg rounded-lg p-2">
                <MdSecurity />
                {t("development.left")}
            </button>

            <button className="flex sm:w-72 justify-center items-center gap-1 bg-green-600 text-white border-2 dark:border-neutral-300/80 shadow-lg rounded-lg p-2">
                <FaCode />
                {t("development.center")}            
            </button>

            <button className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-700 dark:text-neutral-200 border-2 dark:border-neutral-500/80 shadow-lg rounded-lg p-2">
                <SiTeespring />
                {t("development.right")}
            </button>
            
            <Comment step={step} />
        </div>
    )
}