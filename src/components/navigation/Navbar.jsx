import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoDevOutlinedIcon from '@mui/icons-material/LogoDevOutlined';
import getActualRoute from "../../utils/getActualRoute";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { useAuth } from '../../context/AuthContext';

const ItemTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme, currentTheme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
        color: currentTheme === 'dark' ? '#27272A' : '#27272A',
    },
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: currentTheme === 'dark' ? '#27272A' : '#27272A',
        color: currentTheme === 'dark' ? '#FFFFFF' : '#FFFFFFF',
        fontSize: '13px',
    },
}));

export default function Navbar() {
    const { t } = useTranslation('navigation');
    const { theme } = useContext(ThemeContext);
    
    const { handleUser, user } = useAuth();

    console.log(user)
    
    const actualRoute = getActualRoute();
    const defaultClassName = "relative flex justify-center items-center text-gray-600 dark:text-gray-300 rounded-lg hover:text-blue-500 dark:hover:text-sky-500 hover:underline-hover";
    const activeClassName = "relative pb-[5px] flex justify-center items-center rounded-lg text-blue-500 dark:text-sky-500 underline-active";

    return (
        <nav id="navbar" className="fixed top-0 left-0 right-0 flex flex-row justify-between items-center text-main-color bg-white/70 dark:bg-gray-950/80 dark:border-neutral-800 backdrop-blur-md border-b border-gray-200 py-2 px-5">
            <div className="flex flex-row gap-5">

                <ItemTooltip title={t('language')} placement="bottom">
                    <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <LanguageSelector />
                    </div>
                </ItemTooltip>  
            </div>
            
            <nav className="flex flex-row gap-5">
                <NavLink to="/home">
                    <div className={actualRoute === "home" ? activeClassName : defaultClassName}>
                        {t('home')}
                    </div>
                </NavLink>

                <NavLink to="/resume">
                    <div className={actualRoute === "resume" ? activeClassName : defaultClassName}>
                        {t('resume')}
                    </div>
                </NavLink>

                <NavLink to="/blog">
                    <div className={actualRoute === "blog" ? activeClassName : defaultClassName}>
                        Blog
                    </div>
                </NavLink>
            </nav>

            <div className="flex flex-row">
                <ItemTooltip title={user ? user.name : t('user')} placement="bottom">
                    <div 
                        className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg cursor-pointer"
                        onClick={handleUser} 
                    >
                        
                        {user ? (
                            <img src={user.picture} alt="User" className="rounded-full w-6 h-6" />
                        ) : (
                            <PersonOutlineOutlinedIcon className="text-gray-700 dark:text-white"/>
                        )}
                    </div>
                </ItemTooltip>

                <ItemTooltip title={t('theme')} placement="bottom">
                    <div className="flex-col justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <ThemeSelector /> 
                    </div>
                </ItemTooltip>
            </div>


        </nav>
    );
}
