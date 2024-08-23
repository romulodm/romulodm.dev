import { useContext } from "react";
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { ThemeContext } from "../../context/ThemeContext";

export default function ThemeSelector() {
    const { darkThemeActive, setLightMode, setDarkMode } = useContext(ThemeContext);

    return (
        <div className="h-full flex items-center dark:text-white">
            {darkThemeActive() ? (
                <button onClick={setLightMode} className="flex flex-col text-xs items-center justify-center rounded-md">
                    <DarkModeOutlinedIcon/>
                </button>
            ) : (
                <button onClick={setDarkMode} className="flex flex-col text-xs items-center justify-center rounded-md">
                    <LightModeOutlinedIcon/>
                </button>
            )}
        </div>
    )
}