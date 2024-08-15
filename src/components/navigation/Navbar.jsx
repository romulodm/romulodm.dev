import { NavLink } from 'react-router-dom';
import LogoDevOutlinedIcon from '@mui/icons-material/LogoDevOutlined';

import getActualRoute from "../../utils/getActualRoute";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";

export default function Navbar() {
    const actualRoute = getActualRoute();

    const defaultClassName = "relative flex justify-center items-center text-gray-600 rounded-lg hover:text-blue-600 hover:underline-hover";
    const activeClassName = "relative pb-[5px] flex justify-center items-center rounded-lg text-blue-600 underline-active";

    return (
        <nav id="navbar" className="fixed top-0 left-0 right-0 flex flex-row justify-between items-center text-main-color bg-white/70 backdrop-blur-md border-b border-gray-200 py-2 px-5">
            <div className="flex flex-row gap-5">
                <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <NavLink to="/home">
                        <LogoDevOutlinedIcon />
                    </NavLink>                
                </div>
            </div>
            
            <nav className="flex flex-row gap-5">
                <NavLink to="/home">
                    <div className={actualRoute === "home" ? activeClassName : defaultClassName}>
                        Home
                    </div>
                </NavLink>

                <NavLink to="/resume">
                    <div className={actualRoute === "resume" ? activeClassName : defaultClassName}>
                        Resume
                    </div>
                </NavLink>

                <NavLink to="/blog">
                    <div className={actualRoute === "blog" ? activeClassName : defaultClassName}>
                        Blog
                    </div>
                </NavLink>
            </nav>

            <div className="flex flex-row gap-5">
                <div className="flex-col justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <ThemeSelector /> 
                </div>

                <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                    <LanguageSelector />
                </div>
            </div>
        </nav>
    );
}
