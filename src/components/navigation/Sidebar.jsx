import './navigation.css'

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import LanguageSelector from "./LanguageSelector";
import ThemeSelector from "./ThemeSelector";

import LogoDevOutlinedIcon from '@mui/icons-material/LogoDevOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CommentBankOutlinedIcon from '@mui/icons-material/CommentBankOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import getActualRoute from "../../utils/getActualRoute";
import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

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

export default function Sidebar() {
    const { t } = useTranslation('navigation');
    const { theme } = useContext(ThemeContext);

    const actualRoute = getActualRoute();

    return (
        <div id="navbar" className="fixed top-0 left-0 h-screen w-fit px-2 border-r border-y-0 dark:border-neutral-800 flex flex-col justify-between gap-5">
            <div className="flex flex-col flex-1 justify-between">
                <div className="flex justify-center items-center px-4 py-5 text-gray-700 dark:text-white/70 rounded-lg">
                    <NavLink to="/home">
                        <LogoDevOutlinedIcon />
                    </NavLink>
                </div>

                <nav className="flex flex-col py-5 gap-5">
                    <NavLink to="/home">
                        <ItemTooltip title={t('home')} placement="right" currentTheme={theme}>
                            <div className={`flex justify-center dark:text-[white] items-center px-4 py-3 rounded-lg ${actualRoute === "home" ? "active-navicon" : "desactive-navicon"}`}>
                                <HomeOutlinedIcon />
                            </div>
                        </ItemTooltip>
                    </NavLink>

                    <NavLink to="/resume">
                        <ItemTooltip title={t('resume')} placement="right" currentTheme={theme}>
                            <div className={`flex justify-center dark:text-white items-center px-4 py-3 rounded-lg ${actualRoute === "resume" ? "active-navicon" : "desactive-navicon"}`}>
                                <ListAltOutlinedIcon />
                            </div>
                        </ItemTooltip>
                    </NavLink>
                    
                    <NavLink to="/blog">
                        <ItemTooltip title="Blog" placement="right" currentTheme={theme}>
                            <div className={`flex justify-center dark:text-white items-center px-4 py-3 rounded-lg ${actualRoute === "blog" ? "active-navicon" : "desactive-navicon"}`}>
                                <CommentBankOutlinedIcon />
                            </div>
                        </ItemTooltip>
                    </NavLink>
                </nav>

                <div className="flex flex-col py-5 gap-5">
                    <ItemTooltip title={t('theme')} placement="right" currentTheme={theme}>
                        <div className="flex justify-center items-center px-4 py-3 rounded-lg">
                            <ThemeSelector />
                        </div>
                    </ItemTooltip>
                    
                    <ItemTooltip title={t('language')} placement="right" currentTheme={theme}>
                        <div className="flex justify-center items-center px-4 py-3 rounded-lg">
                            <LanguageSelector showTitle={true}/>
                        </div>
                    </ItemTooltip>
                </div>
            </div>
        </div>
    );
}
