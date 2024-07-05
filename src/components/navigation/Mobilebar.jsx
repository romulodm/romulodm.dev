import { NavLink } from 'react-router-dom';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CommentBankOutlinedIcon from '@mui/icons-material/CommentBankOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import getActualRoute from "../../utils/getActualRoute";
import MobilebarTooltip from './MobilebarTooltip';
import { useState } from 'react';

const ItemTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props}  classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.black,
        fontSize: '13px',
    },
  }));

export default function Mobilebar() {
    const [showTooltip, setShowTooltip] = useState(false);

    const actualRoute = getActualRoute();

    const defaultClassName = "flex justify-center items-center px-3 py-2 text-xs text-gray-600 rounded-lg hover:text-white hover:bg-blue-600";
    const activateClassName = "flex justify-center items-center px-3 py-2 text-gray-600 bg-primary-color rounded-lg text-white";

    return (
        <nav id="navbar" className="fixed bottom-0 left-0 right-0 shadow-2xl flex flex-row w-full items-center bg-white/70 backdrop-blur-md border-t border-gray-200 py-2 px-2">
            <div className='flex w-full justify-center'>
                <nav className="flex w-full items-center flex-row gap-2 justify-between max-w-96">
                    <NavLink to="/home">
                        <ItemTooltip title="Início" placement="top">
                            <div className={actualRoute === "home" ? activateClassName : defaultClassName}>
                                <HomeOutlinedIcon style={{fontSize: '1.3rem'}}/>
                            </div>
                        </ItemTooltip>
                    </NavLink>

                    <NavLink to="/resume">
                        <ItemTooltip title="Currículo" placement="top">
                            <div className={actualRoute === "resume" ? activateClassName : defaultClassName}>
                                <ListAltOutlinedIcon style={{fontSize: '1.3rem'}} />
                            </div>
                        </ItemTooltip>
                    </NavLink>

                    <NavLink to="/blog">
                        <ItemTooltip title="Blog" placement="top">
                            <div className={actualRoute === "blog" ? activateClassName : defaultClassName}>
                                <CommentBankOutlinedIcon style={{fontSize: '1.3rem'}}/>
                            </div>
                        </ItemTooltip>
                    </NavLink>

                    { showTooltip ? (
                        <MobilebarTooltip position="bottom" onClose={() => setShowTooltip(false)}>
                            <button 
                                className={`flex justify-center items-center px-2 py-1 text-gray-700 rounded-lg ${activateClassName}`}
                                onClick={() => setShowTooltip(false)}
                            >
                                <SettingsOutlinedIcon style={{fontSize: '1.3rem'}}/>
                            </button>
                        </MobilebarTooltip>

                    ) : (
                        <ItemTooltip title="Configurações" placement="top">
                            <button 
                                className={`flex justify-center items-center px-2 py-1 text-gray-700 rounded-lg ${defaultClassName}`}
                                onClick={() => setShowTooltip(true)}
                            >
                                <SettingsOutlinedIcon style={{fontSize: '1.3rem'}}/>
                            </button>
                        </ItemTooltip>
                    )}

                </nav>
            </div>
        </nav>
    );
}
