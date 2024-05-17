import { useEffect, useState } from "react";

import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

export default function ThemeSelector() {

    const [actualTheme, setActualTheme] = useState(null);
    const theme = localStorage.getItem('theme');

    useEffect(() => {
        if (theme) {
            setLightMode();
            setActualTheme("light");
        } else {
            setActualTheme("dark");
        }
    }, [theme])

    const setDarkMode = () => {
        document.querySelector("body").setAttribute("data-theme", "dark");
        localStorage.removeItem('theme');
        setActualTheme("dark");
    }

    const setLightMode = () => {
        document.querySelector("body").setAttribute("data-theme", "light");
        localStorage.setItem('theme', 'light');
        setActualTheme("light");
    }

    return (
        <div>
            {actualTheme == "dark" ? (
                <button onClick={setLightMode} className="flex justify-center rounded-md">
                    <DarkModeOutlinedIcon/>
                </button>
            ) : (
                <button onClick={setDarkMode} className="flex justify-center rounded-md">
                    <LightModeOutlinedIcon/>
                </button>
            )}
        </div>
    )
}