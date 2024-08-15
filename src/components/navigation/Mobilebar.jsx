import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CommentBankOutlinedIcon from '@mui/icons-material/CommentBankOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import MobilebarTooltip from './MobilebarTooltip';
import getActualRoute from "../../utils/getActualRoute";

export default function Mobilebar() {
    const [showTooltip, setShowTooltip] = useState(false);

    const actualRoute = getActualRoute();

    const defaultClassName = "flex justify-center items-center px-3 py-2 text-xs text-gray-600 rounded-lg hover:text-white hover:bg-blue-600";
    const activateClassName = "flex justify-center items-center px-3 py-2 text-gray-600 bg-primary-color rounded-lg text-white";

    return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white/80 backdrop-blur-md border-t border-t border-gray-200 dark:bg-gray-950/80 dark:border-gray-600">
        <nav className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
            <NavLink to="/home" className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                <HomeOutlinedIcon/>
                <span className="text-xs">Home</span>
            </NavLink>

            <NavLink to="/resume" className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                <ListAltOutlinedIcon/>
                <span className="text-xs">Resume</span>
            </NavLink>

            { showTooltip ? (
                <MobilebarTooltip position="bottom" onClose={() => setShowTooltip(false)}>
                    <button 
                        className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                        onClick={() => setShowTooltip(false)}
                    >
                        <SettingsOutlinedIcon/>
                        <span className="text-xs">Settings</span>
                    </button>
                </MobilebarTooltip>
            ) : (
                <button 
                    className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                    onClick={() => setShowTooltip(true)}
                >
                    <SettingsOutlinedIcon/>
                    <span className="text-xs">Settings</span>
                </button>

            )}
           
            <NavLink to="/blog" className="gap-1 inline-flex flex-col items-center justify-center px-5 group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                <CommentBankOutlinedIcon/>
                <span className="text-xs">Blog</span>
            </NavLink>


        </nav>
    </div>

    );
}
