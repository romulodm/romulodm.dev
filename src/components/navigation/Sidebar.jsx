import { NavLink, useLocation } from 'react-router-dom';

import LanguageSelector from "./LanguageSelector";
import ThemeSelector from "./ThemeSelector";

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CommentBankOutlinedIcon from '@mui/icons-material/CommentBankOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import getActualRoute from "../../utils/getActualRoute";


const ItemTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      fontSize: '13px'
    },
}));

export default function Sidebar() {
    const actualRoute = getActualRoute();

    const defaultClassName = "flex justify-center items-center px-4 py-3 text-gray-600 rounded-lg hover:text-white hover:bg-red-200"
    const activateClassName = "flex justify-center items-center px-4 py-3 text-gray-600 bg-primary-color rounded-lg text-white"

    return (
    <div className="flex flex-col justify-between bg-white min-h-screen px-2 gap-20 w-fit border border-y-0 shadow-2xl">
            <nav className="flex flex-col py-5 gap-5">
                <NavLink to="/home">
                    <ItemTooltip title="Início" placement="right">
                        <div className={actualRoute === "home" ? activateClassName : defaultClassName}>
                            <HomeOutlinedIcon/>
                        </div>
                    </ItemTooltip>
                </NavLink>
                
                <NavLink to="/resume">
                    <ItemTooltip title="Currículo" placement="right">
                        <div className={actualRoute === "transportadoras" ? activateClassName : defaultClassName}>
                            <ListAltOutlinedIcon/>
                        </div>
                    </ItemTooltip>
                </NavLink>

                <NavLink to="/blog">
                <ItemTooltip title="Blog" placement="right">
                    <div className={actualRoute === "usuarios" ? activateClassName : defaultClassName}>
                        <CommentBankOutlinedIcon/>
                    </div>
                </ItemTooltip>
                </NavLink>

                <NavLink to="/projects">
                <ItemTooltip title="Projetos" placement="right">
                    <div className={actualRoute === "usuarios" ? activateClassName : defaultClassName}>
                        <IntegrationInstructionsOutlinedIcon/>
                    </div>
                </ItemTooltip>
                </NavLink>
            </nav>

        <div className="flex flex-col py-5 gap-5">

            <ItemTooltip title="Linguagem" placement="right">
                <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <LanguageSelector/>
                </div>
            </ItemTooltip>
                
            <ItemTooltip title="Tema" placement="right">
                <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <ThemeSelector/>
                </div>
            </ItemTooltip> 
        </div>
    </div>
    );
};