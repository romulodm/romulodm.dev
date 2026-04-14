import LanguageSelector from "./LanguageSelector";
import ThemeSelector from "./ThemeSelector";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

export default function MobilebarTooltip({children}) {
    const { t } = useTranslation('navigation');
    const { handleUser, user } = useAuth();

    return (
        <div id="tooltip" className="relative group h-full">
            <div className="gap-1 h-full w-full inline-flex flex-col items-center justify-center group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                {children}
            </div>
            <span className={`absolute w-20 rounded-lg inner-block bg-neutral-900 dark:bg-neutral-800 shadow-2xl text-white text-xs p-2 left-1/2 -translate-x-[40px] bottom-[calc(100%+2.5px)]`}>
                <div className="flex flex-col gap-5 py-2 justify-between px-1 items-center">
                    
                    <div className="flex flex-col gap-1 justify-center items-center">
                        <button

                            onClick={handleUser} 
                        >
                            
                            {user ? (
                                <img src={user.picture} alt="User" className="h-6 w-6 rounded-full" />
                            ) : (
                                <PersonOutlineOutlinedIcon />
                            )}
                        </button>
                        <p className="text-xs max-w-[50px] text-center truncate">{user ? user.name : t('user')}</p>
                        </div>
                    <div className="flex flex-col gap-1 justify-center items-center">
                        <ThemeSelector/>
                        <p className="text-xs">{t('theme')}</p>
                    </div>
                    <LanguageSelector showTitle={true}/>
                </div>
            </span>
            <span className={`absolute inner-block border-[5px] left-1/2 -translate-x-1/2 bottom-[calc(100%-2px)] border-l-transparent border-r-transparent border-b-0 border-t-neutral-900 dark:border-t-neutral-800`}/>
        </div>
    );
}
