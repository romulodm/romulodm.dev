import { NavLink } from 'react-router-dom';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
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
        fontSize: '13px',
    },
  }));

export default function Mobilebar() {
    const actualRoute = getActualRoute();

    const defaultClassName = "flex justify-center items-center px-4 py-3 text-gray-600 rounded-lg hover:text-white hover:bg-red-200";
    const activateClassName = "flex justify-center items-center px-4 py-3 text-gray-600 bg-primary-color rounded-lg text-white";

    return (
        <nav id="navbar" className="fixed bottom-0 left-0 right-0 shadow-2xl flex flex-row justify-center items-center text-main-color bg-white/70 backdrop-blur-md border-t border-gray-200 py-2 px-5">
            <nav className="flex flex-row gap-3">
                <NavLink to="/home">
                    <ItemTooltip title="Início" placement="top">
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

                <ItemTooltip title="Configurações" placement="top">
                    <div className="flex justify-center items-center px-4 py-3 text-gray-700 rounded-lg">
                        <SettingsOutlinedIcon />
                    </div>
                </ItemTooltip>
            </nav>
        </nav>
    );
}
