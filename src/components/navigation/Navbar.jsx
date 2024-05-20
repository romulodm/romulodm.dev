import { NavLink } from 'react-router-dom';

import LogoDevOutlinedIcon from '@mui/icons-material/LogoDevOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import CommentBankOutlinedIcon from '@mui/icons-material/CommentBankOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import getActualRoute from "../../utils/getActualRoute";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";

const ItemTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.black,
        fontSize: '13px',
    },
}));

export default function Navbar() {
    const actualRoute = getActualRoute();

    const defaultClassName = "flex justify-center items-center px-4 py-3 text-gray-600 rounded-lg hover:text-white hover:bg-red-200";
    const activateClassName = "flex justify-center items-center px-4 py-3 text-gray-600 bg-primary-color rounded-lg text-white";

    return (
        <nav id="navbar" className="fixed top-0 left-0 right-0 flex flex-row justify-between items-center text-main-color bg-white/70 backdrop-blur-md border-b shadow-md border-gray-200 py-2 px-5">
            <div className="flex flex-row gap-5">
                <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <LogoDevOutlinedIcon/>
                </div>
            </div>
            
            <nav className="flex flex-row gap-5">
                <NavLink to="/home">
                    <ItemTooltip title="Início" placement="bottom">
                        <div className={actualRoute === "home" ? activateClassName : defaultClassName}>
                            <HomeOutlinedIcon />
                        </div>
                    </ItemTooltip>
                </NavLink>

                <NavLink to="/resume">
                    <ItemTooltip title="Currículo" placement="top">
                        <div className={actualRoute === "resume" ? activateClassName : defaultClassName}>
                            <ListAltOutlinedIcon />
                        </div>
                    </ItemTooltip>
                </NavLink>

                <NavLink to="/blog">
                    <ItemTooltip title="Blog" placement="top">
                        <div className={actualRoute === "blog" ? activateClassName : defaultClassName}>
                            <CommentBankOutlinedIcon />
                        </div>
                    </ItemTooltip>
                </NavLink>

                <NavLink to="/projects">
                    <ItemTooltip title="Projetos" placement="top">
                        <div className={actualRoute === "projects" ? activateClassName : defaultClassName}>
                            <IntegrationInstructionsOutlinedIcon />
                        </div>
                    </ItemTooltip>
                </NavLink>
            </nav>

            <div className="flex flex-row gap-5">

                <ItemTooltip title="Linguagem" placement="bottom">
                    <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <LanguageSelector/>
                    </div>
                </ItemTooltip>
                    
                <ItemTooltip title="Tema" placement="bottom">
                    <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <ThemeSelector/> 
                    </div>
                </ItemTooltip> 
            </div>
        </nav>
    );
}
