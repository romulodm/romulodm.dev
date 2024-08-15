import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CommentBankOutlinedIcon from '@mui/icons-material/CommentBankOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import MobilebarTooltip from './MobilebarTooltip';
import getActualRoute from '../../utils/getActualRoute';

export default function Mobilebar() {
    const { t } = useTranslation('navigation');
    const [showTooltip, setShowTooltip] = useState(false);

    const actualRoute = getActualRoute();
    const defaultClassName = "gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
    const activeClassName = "gap-1 inline-flex flex-col items-center justify-center px-5 group text-blue-600 dark:text-blue-500"

    return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white/80 backdrop-blur-md border-t border-t border-gray-200 dark:bg-gray-950/80 dark:border-gray-600">
        <nav className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
            <NavLink to="/home" className={actualRoute === "home" ? activeClassName : defaultClassName}>
                <HomeOutlinedIcon/>
                <span className="text-xs">{t('home')}</span>
            </NavLink>

            <NavLink to="/resume" className={actualRoute === "resume" ? activeClassName : defaultClassName}>
                <ListAltOutlinedIcon/>
                <span className="text-xs">{t('resume')}</span>
            </NavLink>

            { showTooltip ? (
                <MobilebarTooltip position="bottom" onClose={() => setShowTooltip(false)}>
                    <button 
                        className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                        onClick={() => setShowTooltip(false)}
                    >
                        <SettingsOutlinedIcon/>
                        <span className="text-xs">{t('settings')}</span>
                    </button>
                </MobilebarTooltip>
            ) : (
                <button 
                    className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                    onClick={() => setShowTooltip(true)}
                >
                    <SettingsOutlinedIcon/>
                    <span className="text-xs">{t('settings')}</span>
                </button>

            )}
           
            <NavLink to="/blog" className={actualRoute === "blog" ? activeClassName : defaultClassName}>
                <CommentBankOutlinedIcon/>
                <span className="text-xs">Blog</span>
            </NavLink>


        </nav>
    </div>

    );
}
