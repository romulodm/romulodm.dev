import { NavLink } from 'react-router-dom';
import LogoDevOutlinedIcon from '@mui/icons-material/LogoDevOutlined';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import getActualRoute from "../../utils/getActualRoute";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";

const ItemTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
        color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.black,
        fontSize: '13px',
    },
}));

export default function Navbar() {
    const actualRoute = getActualRoute();

    const defaultClassName = "relative flex justify-center items-center text-gray-600 rounded-lg hover:text-blue-600 hover:underline-hover";
    const activeClassName = "relative pb-[5px] flex justify-center items-center rounded-lg text-blue-600 underline-active";

    return (
        <nav id="navbar" className="fixed top-0 left-0 right-0 flex flex-row justify-between items-center text-main-color bg-white/70 backdrop-blur-md border-b shadow-md border-gray-200 py-2 px-5">
            <div className="flex flex-row gap-5">
                <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <NavLink to="/home">
                        <LogoDevOutlinedIcon />
                    </NavLink>                
                </div>
            </div>
            
            <nav className="flex flex-row gap-5">
                <NavLink to="/home">
                    <ItemTooltip title="Início" placement="bottom">
                        <div className={actualRoute === "home" ? activeClassName : defaultClassName}>
                            Home
                        </div>
                    </ItemTooltip>
                </NavLink>

                <NavLink to="/resume">
                    <ItemTooltip title="Currículo" placement="top">
                        <div className={actualRoute === "resume" ? activeClassName : defaultClassName}>
                            Resume
                        </div>
                    </ItemTooltip>
                </NavLink>

                <NavLink to="/blog">
                    <ItemTooltip title="Blog" placement="top">
                        <div className={actualRoute === "blog" ? activeClassName : defaultClassName}>
                            Blog
                        </div>
                    </ItemTooltip>
                </NavLink>
            </nav>

            <div className="flex flex-row gap-5">
                <ItemTooltip title="Tema" placement="bottom">
                    <div className="flex-col justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <ThemeSelector /> 
                    </div>
                </ItemTooltip> 

                <ItemTooltip title="Linguagem" placement="bottom">
                    <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <LanguageSelector />
                    </div>
                </ItemTooltip>
            </div>
        </nav>
    );
}
