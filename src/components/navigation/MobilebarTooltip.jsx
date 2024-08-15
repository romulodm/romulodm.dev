import { CgClose } from "react-icons/cg";
import LanguageSelector from "./LanguageSelector";
import ThemeSelector from "./ThemeSelector";

export default function MobilebarTooltip({children}) {
    return (
        <div id="tooltip" className="relative group h-full">
            <div className="gap-1 h-full w-full inline-flex flex-col items-center justify-center group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                {children}
            </div>
            <span className={`absolute w-20 rounded-lg inner-block bg-gray-800 dark:bg-neutral-900 shadow-2xl text-white text-xs p-2 left-1/2 -translate-x-[40px] bottom-[calc(100%+2.5px)]`}>
                <div className="flex flex-col gap-4 py-2 justify-between px-1 items-center">
                    <LanguageSelector showTitle={true}/>
                    <ThemeSelector/>
                </div>
            </span>
            <span className={`absolute inner-block border-[5px] left-1/2 -translate-x-1/2 bottom-[calc(100%-2px)] border-l-transparent border-r-transparent border-b-0 border-t-neutral-800 dark:border-t-neutral-900`}/>
        </div>
    );
}
