import { CgClose } from "react-icons/cg";
import LanguageSelector from "./LanguageSelector";
import ThemeSelector from "./ThemeSelector";

export default function MobilebarTooltip({children}) {
    return (
        <div id="tooltip" className="relative group">
            <div className="">
                {children}
            </div>
            <span className={`absolute w-20 rounded-lg inner-block bg-neutral-900 shadow-2xl text-white text-xs p-2 'left-1/2 -translate-x-[17px] bottom-[calc(100%+4.7px)]`}>
                <div className="flex flex-col gap-4 py-2 justify-between px-1 items-center">
                    <LanguageSelector showTitle={true}/>
                    <ThemeSelector/>
                </div>
            </span>
            <span className={`absolute inner-block border-[5px] left-1/2 -translate-x-1/2 bottom-full border-l-transparent border-r-transparent border-b-0 border-t-neutral-900`}/>
        </div>
    );
}
