import { useContext } from "react";
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { ThemeContext } from "../../context/ThemeContext";

export default function ThemeSelector() {
    const { darkThemeActive, setLightMode, setDarkMode } = useContext(ThemeContext);

    return (
        <div className="h-full flex items-center">
            {darkThemeActive() ? (
                <button onClick={setLightMode} className="flex flex-col text-xs items-center justify-center rounded-md transition-all duration-300">
                    <DarkModeOutlinedIcon style={{ transition: 'transform 0.3s ease-in-out', transform: 'rotate(360deg)' }}/>
                </button>
            ) : (
                <button onClick={setDarkMode} className="flex flex-col text-xs items-center justify-center rounded-md transition-all duration-300">
                    <LightModeOutlinedIcon style={{ transition: 'transform 0.3s ease-in-out', transform: 'rotate(360deg)' }}/>
                </button>
            )}
        </div>
    )
}
